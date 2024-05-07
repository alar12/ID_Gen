const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
const csv = require('csv-parser');

const PNG_TEMPLATE_PATH = 'C:/Users/adith/OneDrive/Desktop/ID_Gen/template.png'; // Path to your PNG template
const CSV_FILE_PATH = 'C:/Users/adith/OneDrive/Desktop/ID_Gen/data.csv'; // Path to your CSV file
const PHOTO_DIRECTORY = 'C:/Users/adith/OneDrive/Desktop/ID_Gen/photos/'; // Path to your photo directory
const OUTPUT_PDF_PATH = 'C:/Users/adith/OneDrive/Desktop/ID_Gen/employee_ids.pdf'; // Output PDF path

async function createPDF() {
    const pngBytes = fs.readFileSync(PNG_TEMPLATE_PATH);

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Parse CSV file
    const csvData = [];
    fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on('data', (row) => {
            csvData.push(row);
        })
        .on('end', async () => {
            for (let i = 0; i < csvData.length; i++) {
                // Add a new page for each employee ID with reduced height
                const page = pdfDoc.addPage([320, 250]); // Width remains the same, height halved
                
                // Embed PNG template onto the PDF page
                const pngImage = await pdfDoc.embedPng(pngBytes);
                const { width, height } = pngImage.scale(1);
                page.drawImage(pngImage, {
                    x: 0,
                    y: 0,
                    width: page.getWidth(),
                    height: page.getHeight(),
                });

                const name = csvData[i].name;
                const title = csvData[i].title;
                const photoFilename = csvData[i].photoFilename;
                const photoPath = `${PHOTO_DIRECTORY}${photoFilename}`;

                // Embed employee photo into the PDF (regardless of image type)
                const photoBytes = fs.readFileSync(photoPath);
                const photoImage = await pdfDoc.embedJpg(photoBytes);
                const photoDims = photoImage.scale(0.5);
                page.drawImage(photoImage, {
                    x: page.getWidth() - photoDims.width - 40, // Move picture to the right
                    y: page.getHeight() / 2 - photoDims.height / 3,
                    width: photoDims.width,
                    height: photoDims.height,
                });

                // Add employee name and title to the page
                page.drawText(name || 'Name not found', {
                    x: 50, // Adjust position as per your template
                    y: 20,
                    size: 12,
                    color: rgb(0, 0, 0),
                });
                page.drawText(title || 'Title not found', {
                    x: 50, // Adjust position as per your template
                    y: 10,
                    size: 10,
                    color: rgb(0, 0, 0),
                });
            }

            // Save the PDF to a file
            const pdfBytes = await pdfDoc.save();
            fs.writeFileSync(OUTPUT_PDF_PATH, pdfBytes);
            console.log('PDF created successfully.');
        });
}

createPDF().catch(console.error);
