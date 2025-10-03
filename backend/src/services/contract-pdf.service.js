const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ContractPDFService {
    static async generateContractPDF(contract, application) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: { top: 50, bottom: 50, left: 50, right: 50 }
                });

                // Generate filename
                const filename = `contract_${contract.contract_number}_${Date.now()}.pdf`;
                const filepath = path.join(__dirname, '../../uploads/contracts', filename);
                
                // Ensure directory exists
                const dir = path.dirname(filepath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                // Pipe to file
                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);

                // Nigerian Green color
                const nigerianGreen = '#008751';

                // Header
                doc.fontSize(24)
                   .fillColor(nigerianGreen)
                   .text('GRANDPRO HMSO', { align: 'center' });
                
                doc.fontSize(18)
                   .fillColor('black')
                   .text('Hospital Partnership Agreement', { align: 'center' });
                
                doc.moveDown();
                doc.fontSize(10)
                   .text(`Contract Number: ${contract.contract_number}`, { align: 'right' });
                doc.text(`Date: ${new Date().toLocaleDateString('en-NG')}`, { align: 'right' });
                
                doc.moveDown(2);

                // Parties
                doc.fontSize(14)
                   .fillColor(nigerianGreen)
                   .text('PARTIES', { underline: true });
                doc.moveDown(0.5);
                
                doc.fontSize(11)
                   .fillColor('black')
                   .text('This Agreement is entered into between:', { paragraphGap: 5 });
                
                doc.text(`1. GrandPro HMSO ("Company"), a healthcare management organization registered in Nigeria`, { indent: 20 });
                doc.text(`2. ${application.hospital_name} ("Partner"), represented by ${application.owner_first_name} ${application.owner_last_name}`, { indent: 20 });
                
                doc.moveDown();

                // Hospital Details
                doc.fontSize(14)
                   .fillColor(nigerianGreen)
                   .text('HOSPITAL DETAILS', { underline: true });
                doc.moveDown(0.5);
                
                doc.fontSize(11)
                   .fillColor('black');
                
                const details = [
                    ['Hospital Name:', application.hospital_name],
                    ['Registration Number:', application.cac_registration_number || 'N/A'],
                    ['Address:', `${application.hospital_address}, ${application.hospital_city}, ${application.hospital_state}`],
                    ['Contact Email:', application.owner_email],
                    ['Contact Phone:', application.owner_phone],
                    ['Bed Capacity:', application.bed_capacity],
                    ['Staff Count:', application.number_of_staff],
                    ['Years in Operation:', application.years_in_operation]
                ];

                details.forEach(([label, value]) => {
                    doc.font('Helvetica-Bold').text(label, { continued: true, indent: 20 });
                    doc.font('Helvetica').text(` ${value}`);
                });

                doc.moveDown();

                // Terms and Conditions
                doc.fontSize(14)
                   .fillColor(nigerianGreen)
                   .text('TERMS AND CONDITIONS', { underline: true });
                doc.moveDown(0.5);
                
                doc.fontSize(11)
                   .fillColor('black');
                
                const terms = [
                    `1. Partnership Duration: ${contract.contract_duration_months || 24} months`,
                    `2. Commission Rate: ${contract.commission_rate}% of gross revenue`,
                    `3. Payment Terms: ${contract.payment_terms || 'Net 30 days'}`,
                    `4. Start Date: ${new Date(contract.start_date).toLocaleDateString('en-NG')}`,
                    `5. End Date: ${new Date(contract.end_date).toLocaleDateString('en-NG')}`,
                    `6. Auto Renewal: ${contract.auto_renewal ? 'Yes' : 'No'}`
                ];

                terms.forEach(term => {
                    doc.text(term, { indent: 20, paragraphGap: 5 });
                });

                doc.moveDown();

                // Nigerian Regulatory Compliance
                doc.fontSize(14)
                   .fillColor(nigerianGreen)
                   .text('NIGERIAN REGULATORY COMPLIANCE', { underline: true });
                doc.moveDown(0.5);
                
                doc.fontSize(11)
                   .fillColor('black')
                   .text('The Partner certifies compliance with:', { indent: 20 });
                
                const compliance = [
                    '• Corporate Affairs Commission (CAC) registration',
                    '• National Health Insurance Scheme (NHIS) requirements',
                    '• Federal Inland Revenue Service (FIRS) tax obligations',
                    '• Medical and Dental Council of Nigeria (MDCN) standards',
                    '• National Agency for Food and Drug Administration and Control (NAFDAC) regulations',
                    '• Nigerian Medical Association (NMA) guidelines'
                ];

                compliance.forEach(item => {
                    doc.text(item, { indent: 40, paragraphGap: 3 });
                });

                // Add new page for signature section
                doc.addPage();

                // Service Standards
                doc.fontSize(14)
                   .fillColor(nigerianGreen)
                   .text('SERVICE STANDARDS', { underline: true });
                doc.moveDown(0.5);
                
                doc.fontSize(11)
                   .fillColor('black')
                   .text('The Partner agrees to maintain:', { indent: 20 });
                
                const standards = [
                    '• 24/7 emergency services availability',
                    '• Electronic Medical Records (EMR) system',
                    '• Monthly operational and financial reporting',
                    '• Patient satisfaction score of at least 80%',
                    '• Compliance with GrandPro HMSO quality standards'
                ];

                standards.forEach(item => {
                    doc.text(item, { indent: 40, paragraphGap: 3 });
                });

                doc.moveDown(2);

                // Signature Section
                doc.fontSize(14)
                   .fillColor(nigerianGreen)
                   .text('SIGNATURES', { underline: true });
                doc.moveDown();
                
                doc.fontSize(11)
                   .fillColor('black');
                
                // Company signature
                doc.text('For GrandPro HMSO:', { indent: 20 });
                doc.moveDown();
                doc.text('_______________________________', { indent: 20 });
                doc.text('Authorized Representative', { indent: 20 });
                doc.text(`Date: ${new Date().toLocaleDateString('en-NG')}`, { indent: 20 });
                
                doc.moveDown(2);
                
                // Partner signature
                doc.text('For Partner Hospital:', { indent: 20 });
                doc.moveDown();
                doc.text('_______________________________', { indent: 20 });
                doc.text(`${application.owner_first_name} ${application.owner_last_name}`, { indent: 20 });
                doc.text(`Date: ${new Date().toLocaleDateString('en-NG')}`, { indent: 20 });

                // Footer
                doc.fontSize(9)
                   .fillColor('gray')
                   .text('This agreement is governed by the laws of the Federal Republic of Nigeria', 50, 750, { align: 'center' });

                // Finalize PDF
                doc.end();

                // Wait for stream to finish
                stream.on('finish', () => {
                    resolve({
                        success: true,
                        filename,
                        filepath,
                        size: fs.statSync(filepath).size
                    });
                });

                stream.on('error', reject);
            } catch (error) {
                reject(error);
            }
        });
    }

    static async generateContractFromTemplate(contract, application, template) {
        // This method can be extended to use different templates
        return this.generateContractPDF(contract, application);
    }
}

module.exports = ContractPDFService;
