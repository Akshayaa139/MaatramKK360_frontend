// Simulate logic
const norm = (s) => String(s || "").trim().toLowerCase();
const scheduleEquals = (a, b) => a.day === b.day && a.startTime === b.startTime;

// Mock Data
const mockTutor = {
    _id: "tutor123",
    user: { name: "John Doe" },
    availability: []
};
const mockStudent = { _id: "student123" };
const mockClasses = [];

// Helper Function Simulation
async function ensureClassForTutorAndStudent(tutor, student, subject, slot = null) {
    let existing = null;
    const normSubject = norm(subject);

    if (slot) {
        existing = mockClasses.find(
            (c) => norm(c.subject) === normSubject && scheduleEquals(c.schedule, slot)
        );
    }
    if (!existing) existing = mockClasses.find((c) => norm(c.subject) === normSubject);

    let tutorName = "Group";
    if (tutor.user && tutor.user.name) tutorName = tutor.user.name;

    if (existing) {
        console.log("Found existing class, updating...");
        if (!existing.title || / - [0-9a-f]{24}$/i.test(existing.title)) {
            existing.title = `${subject} - ${tutorName}`;
        }
        if (!existing.sessionLink || !existing.sessionLink.includes('meet.jit.si')) {
            const slug = normSubject.replace(/[^a-z0-9]/g, "");
            existing.sessionLink = `https://meet.jit.si/KK360-${slug}-${Date.now()}`;
        }
        return existing;
    }

    console.log("Creating NEW class...");
    const sched = slot || { day: "Monday", startTime: "10:00", endTime: "11:00" }; // Default fallback
    const slug = normSubject.replace(/[^a-z0-9]/g, "");

    const newClass = {
        title: `${subject} - ${tutorName}`,
        subject,
        tutor: tutor._id,
        students: [student._id],
        schedule: sched,
        sessionLink: `https://meet.jit.si/KK360-${slug}-${Date.now()}`,
    };
    mockClasses.push(newClass);
    return newClass;
}

// Test Run
async function run() {
    console.log("--- Test 1: Create New Class ---");
    const cls1 = await ensureClassForTutorAndStudent(mockTutor, mockStudent, "Physics");
    console.log("Class 1:", cls1);

    console.log("\n--- Test 2: Reuse Existing Class ---");
    const cls2 = await ensureClassForTutorAndStudent(mockTutor, { _id: "student456" }, "Physics");
    console.log("Class 2 (Should define same object):", cls1 === cls2);
    console.log("Class 2 Title:", cls2.title); // Should be Physics - John Doe
}

run();
