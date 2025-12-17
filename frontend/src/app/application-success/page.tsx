"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download, Mail } from "lucide-react";
import { useState, Suspense } from "react";

function ApplicationSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicationNumber = searchParams.get("applicationNumber");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const applicationData = {
        applicationNumber,
        submittedDate: new Date().toISOString(),
        status: 'Submitted',
        message: 'Your application has been received and is under review.'
      };
      const dataStr = JSON.stringify(applicationData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `KK_Application_${applicationNumber}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl">
        <CardHeader className="text-center bg-gradient-to-r from-green-500 to-blue-500 text-white">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Application Submitted Successfully!</CardTitle>
          <CardDescription className="text-green-100 text-lg">
            Your application has been received and is under review
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 p-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Application Number</h3>
            <div className="text-3xl font-bold text-blue-600 bg-white rounded-lg p-4 border-2 border-blue-300">
              {applicationNumber}
            </div>
            <p className="text-blue-700 mt-3 text-sm">
              Please save this application number for future reference
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">What happens next?</h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-green-500 text-white rounded-full p-1 mt-1">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Application Review</h4>
                  <p className="text-gray-600 text-sm">Our team will review your application within 3-5 working days</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500 text-white rounded-full p-1 mt-1">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Email Notification</h4>
                  <p className="text-gray-600 text-sm">You will receive an email with further instructions</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-purple-500 text-white rounded-full p-1 mt-1">
                  <span className="text-xs font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Tele-verification</h4>
                  <p className="text-gray-600 text-sm">If shortlisted, you will be contacted for tele-verification</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleDownloadPDF} disabled={isDownloading} className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>{isDownloading ? 'Downloading...' : 'Download Application Details'}</span>
            </Button>
            
            <Button onClick={() => router.push('/')} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Back to Home
            </Button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Need Help?</h4>
            <p className="text-yellow-700 text-sm">
              If you have any questions about your application, please contact us at:
              <br />
              <strong>Email:</strong> support@karpomkarpippom.org
              <br />
              <strong>Phone:</strong> +91-XXXXXXXXXX
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ApplicationSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4">Loading...</div>}>
      <ApplicationSuccessContent />
    </Suspense>
  );
}