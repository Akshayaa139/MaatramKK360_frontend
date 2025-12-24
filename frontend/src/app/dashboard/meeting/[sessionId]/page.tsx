"use client";

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
// import { useSession } from 'next-auth/react';
import { useTabSession } from '@/hooks/useTabSession';
import api from '@/lib/api';
import { Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    params: Promise<{
        sessionId: string;
    }>
}

export default function MeetingPage({ params }: Props) {
    const { sessionId: classId } = use(params); // The URL param is actually the classId
    const { data: session } = useTabSession();
    const router = useRouter(); // Use App Router
    const [loading, setLoading] = useState(true);
    const jitsiRef = useRef<any>(null);
    const [jitsiApi, setJitsiApi] = useState<any>(null);
    // Persist real sessionId (from DB log) across renders
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    useEffect(() => {
        // Load Jitsi script
        const script = document.createElement("script");
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;
        script.onload = () => initJitsi();
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
            if (jitsiApi) jitsiApi.dispose();
        }
    }, [classId, session]);

    const initJitsi = () => {
        if (!window.JitsiMeetExternalAPI) return;
        fetchSessionDetails();
    };

    const fetchSessionDetails = async () => {
        try {
            // Start/Join the session (Idempotent-ish, or creates a new log entry)
            // Ideally, we should have a 'join' endpoint if it's already started, 
            // but 'start' updates the link and returns info.
            // Note: The URL param is 'sessionId' in the file structure, but functionally it's acting as 'classId' 
            // based on how it's used in api.post(`/classes/${sessionId}/start`).

            // Start/Join logic
            // Tutors use 'start' to initialize/update. Students use 'join'.
            // Actually, for simplicity, both can use 'join' if 'start' logic (updating link) isn't needed every time,
            // BUT Tutors definitely need to 'start' to create the ClassSession log entry.
            // Let's keep separate: Tutors -> start, Students -> join.
            // Or easier: 'join' endpoint handles read-only, 'start' handles write.
            // MeetingPage doesn't know until we check role, or we try 'start' and fallback to 'join' on 403?
            // Better: Check role in session.

            let res;
            if (session?.user?.role === 'tutor') {
                res = await api.post(`/classes/${classId}/start`, {});
            } else {
                res = await api.post(`/classes/${classId}/join`, {});
            }

            const link = res.data.sessionLink;
            const dbSessionId = res.data.sessionId; // Now returned by backend
            setActiveSessionId(dbSessionId);

            const roomName = link.split("/").pop();

            // Log Join
            if (dbSessionId) {
                await api.post(`/classes/session/${dbSessionId}/log`, { action: 'join' });
            }

            const domain = "meet.jit.si";
            const options = {
                roomName: roomName,
                width: "100%",
                height: "100%",
                parentNode: jitsiRef.current,
                userInfo: {
                    displayName: session?.user?.name || "Participant"
                },
                configOverwrite: {
                    prejoinPageEnabled: false,
                    // Ensure the toolbar has the hangup button
                },
                interfaceConfigOverwrite: {
                }
            };

            const apiInstance = new window.JitsiMeetExternalAPI(domain, options);
            setJitsiApi(apiInstance);
            setLoading(false);

            apiInstance.addEventListeners({
                videoConferenceLeft: () => handleLeft(dbSessionId),
            });

        } catch (error) {
            console.error("Failed to init meeting", error);
        }
    };

    const handleLeft = async (dbSessionId: string | null) => {
        // Log leave only, do NOT redirect automatically.
        // This allows the user to 'Login' to Jitsi if required without being kicked out.
        try {
            if (dbSessionId || activeSessionId) {
                await api.post(`/classes/session/${dbSessionId || activeSessionId}/log`, { action: 'leave' });
            }
        } catch (e) { }

        // window.location.href = "/dashboard/my-classes"; // REMOVED to prevent loop on login
    };

    const handleManualExit = async () => {
        if (jitsiApi) jitsiApi.dispose();
        await handleLeft(activeSessionId);
        router.push("/dashboard/my-classes");
    };

    return (
        <div className="h-[calc(100vh-100px)] w-full flex flex-col relative">
            {/* Header/Controls Overlay */}
            <div className="bg-background border-b p-2 flex justify-between items-center">
                <h3 className="font-semibold px-2">Live Class</h3>
                <Button variant="destructive" size="sm" onClick={handleManualExit}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Exit Class
                </Button>
            </div>

            {loading && <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>}
            <div ref={jitsiRef} className="flex-1 w-full h-full" />
        </div>
    );
}

declare global {
    interface Window {
        JitsiMeetExternalAPI: any;
    }
}
