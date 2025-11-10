const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

class PdfService {
    static async generateApplicationPdf(application) {
        const doc = new PDFDocument();
        const filePath = path.join(__dirname, '..', '.._uploads', 'applications', `${application.applicationId}.pdf`);

        // Ensure the directory exists
        await fs.ensureDir(path.dirname(filePath));

        // Pipe its output to a file
        doc.pipe(fs.createWriteStream(filePath));

        // Add content to the PDF
        doc.fontSize(25).text('Student Application Form', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(`Application ID: ${application.applicationId}`);
        doc.moveDown();

        // Add student details
        doc.fontSize(12).text(`Name: ${application.name}`);
        doc.text(`Email: ${application.email}`);
        doc.text(`Phone: ${application.phone}`);
        doc.text(`Date of Birth: ${application.dob}`);
        doc.text(`Address: ${application.address.street}, ${application.address.city}, ${application.address.state}, ${application.address.zip}`);
        doc.moveDown();

        // Add academic details
        doc.fontSize(14).text('Academic Information', { underline: true });
        doc.moveDown();
        doc.text(`School: ${application.schoolName}`);
        doc.text(`Board: ${application.board}`);
        doc.text(`Class: ${application.class}`);
        doc.moveDown();

        // Add subjects
        doc.fontSize(14).text('Subjects', { underline: true });
        doc.moveDown();
        application.subjects.forEach(subject => {
            doc.text(`- ${subject.name} (${subject.medium})`);
        });

        // Finalize the PDF and end the stream
        doc.end();

        return filePath;
    }
}

module.exports = PdfService;