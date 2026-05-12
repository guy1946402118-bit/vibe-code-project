import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportToPDF(elementId: string, filename: string = 'growth-dashboard.pdf') {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0a0a0a',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}

export async function exportDataToPDF(data: {
  title: string;
  subtitle?: string;
  sections: Array<{
    heading: string;
    content: Array<{ label: string; value: string }>;
  }>;
  footer?: string;
}, filename: string = 'report.pdf') {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  pdf.setFontSize(24);
  pdf.setTextColor(57, 255, 20);
  pdf.text(data.title, margin, yPosition);
  yPosition += 10;

  if (data.subtitle) {
    pdf.setFontSize(12);
    pdf.setTextColor(136, 136, 136);
    pdf.text(data.subtitle, margin, yPosition);
    yPosition += 8;
  }

  yPosition += 5;
  pdf.setDrawColor(57, 255, 20);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  data.sections.forEach((section) => {
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(57, 255, 20);
    pdf.text(section.heading, margin, yPosition);
    yPosition += 8;

    section.content.forEach((item) => {
      if (yPosition > pageHeight - 25) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(11);
      pdf.setTextColor(200, 200, 200);
      pdf.text(`${item.label}:`, margin, yPosition);

      pdf.setTextColor(232, 232, 232);
      pdf.text(item.value, margin + 50, yPosition);
      yPosition += 7;
    });

    yPosition += 5;
  });

  if (data.footer && yPosition < pageHeight - 20) {
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(data.footer, margin, pageHeight - 15);
  }

  pdf.save(filename);
  return true;
}

export default { exportToPDF, exportDataToPDF };
