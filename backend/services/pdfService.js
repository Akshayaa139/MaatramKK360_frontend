const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

class PdfService {
    static async generateApplicationPdf(application) {
        const doc = new PDFDocument();
        const filePath = path.join(__dirname, '..', 'uploads', 'applications', `${application.applicationId}.pdf`);

        // Ensure the directory exists
        await fs.ensureDir(path.dirname(filePath));

        // Pipe its output to a file
        doc.pipe(fs.createWriteStream(filePath));

        // Add content to the PDF
        doc.fontSize(25).text('Karpom Karpippom - Student Application Form', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(`Application ID: ${application.applicationId}`, { align: 'center' });
        doc.moveDown(2);

        // Personal Information
        doc.fontSize(14).text('Personal Information', { underline: true });
        doc.moveDown();
        const personalInfo = application.personalInfo || {};
        doc.fontSize(12).text(`Name: ${personalInfo.fullName || application.name || 'N/A'}`);
        doc.text(`Email: ${personalInfo.email || application.email || 'N/A'}`);
        doc.text(`Phone: ${personalInfo.phone || application.phone || 'N/A'}`);
        doc.text(`Date of Birth: ${personalInfo.dateOfBirth || 'N/A'}`);
        doc.text(`Gender: ${personalInfo.gender || 'N/A'}`);
        if (personalInfo.address) {
            doc.text(`Address: ${personalInfo.address.street || ''}, ${personalInfo.address.city || ''}, ${personalInfo.address.state || ''}, ${personalInfo.address.pincode || ''}`);
        } else if (application.address) {
            doc.text(`Address: ${application.address}`);
        }
        doc.moveDown();

        // Educational Information
        doc.fontSize(14).text('Educational Information', { underline: true });
        doc.moveDown();
        const educationalInfo = application.educationalInfo || {};
        doc.fontSize(12).text(`Current Class: ${educationalInfo.currentClass || 'N/A'}`);
        doc.text(`School: ${educationalInfo.schoolName || 'N/A'}`);
        doc.text(`Board: ${educationalInfo.board || 'N/A'}`);
        doc.text(`Medium: ${educationalInfo.medium || 'N/A'}`);
        doc.text(`10th Percentage: ${educationalInfo.tenthPercentage || 'N/A'}%`);
        doc.text(`Current Percentage: ${educationalInfo.currentPercentage || 'N/A'}%`);
        doc.moveDown();

        // Subjects
        if (educationalInfo.subjects && educationalInfo.subjects.length > 0) {
            doc.fontSize(14).text('Subjects Applied For', { underline: true });
            doc.moveDown();
            educationalInfo.subjects.forEach(subject => {
                if (typeof subject === 'object') {
                    doc.fontSize(12).text(`- ${subject.name || subject} (${subject.medium || 'N/A'})`);
                } else {
                    doc.fontSize(12).text(`- ${subject}`);
                }
            });
            doc.moveDown();
        }

        // Family Information
        const familyInfo = application.familyInfo || {};
        if (familyInfo.fatherName || familyInfo.motherName) {
            doc.fontSize(14).text('Family Information', { underline: true });
            doc.moveDown();
            doc.fontSize(12).text(`Father's Name: ${familyInfo.fatherName || 'N/A'}`);
            doc.text(`Father's Occupation: ${familyInfo.fatherOccupation || 'N/A'}`);
            doc.text(`Mother's Name: ${familyInfo.motherName || 'N/A'}`);
            doc.text(`Mother's Occupation: ${familyInfo.motherOccupation || 'N/A'}`);
            doc.text(`Annual Income: ₹${familyInfo.annualIncome || 'N/A'}`);
            doc.moveDown();
        }

        // Additional Information
        const additionalInfo = application.additionalInfo || {};
        if (additionalInfo.whyKK || additionalInfo.goals) {
            doc.fontSize(14).text('Additional Information', { underline: true });
            doc.moveDown();
            if (additionalInfo.whyKK) {
                doc.fontSize(12).text(`Why KK: ${additionalInfo.whyKK}`);
                doc.moveDown();
            }
            if (additionalInfo.goals) {
                doc.fontSize(12).text(`Goals: ${additionalInfo.goals}`);
                doc.moveDown();
            }
        }

        doc.moveDown();
        doc.fontSize(10).text(`Submitted on: ${new Date(application.createdAt || Date.now()).toLocaleString()}`, { align: 'right' });

        // Finalize the PDF and end the stream
        doc.end();

        return filePath;
    }
}

module.exports = PdfService;