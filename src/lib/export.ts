import jsPDF from 'jspdf';
import { SimulationResult, Company } from '../types';
import { formatFCFA, formatPercent, formatDateFrench } from './formatters';

/**
 * Generate CSV file from a SimulationResult
 */
export function exportSimulationToCSV(simulation: SimulationResult): void {
  const headers = ['Propriété', 'Valeur'];
  const rows = [
    ['Titre de la simulation', simulation.title],
    ['Entreprise', `${simulation.companyName} (${simulation.companySymbol})`],
    ['Date de début', simulation.startDate],
    ['Date de fin', simulation.endDate],
    ['Montant investi (FCFA)', simulation.initialAmount.toString()],
    ['Prix d\'achat initial (FCFA)', simulation.initialPrice.toString()],
    ['Prix final (FCFA)', simulation.finalPrice.toString()],
    ['Nombre de titres détenus', simulation.sharesBought.toString()],
    ['Mode de dividende', simulation.dividendMode],
    ['Dividendes reçus (FCFA)', simulation.totalDividendsReceived.toString()],
    ['Valeur finale (FCFA)', simulation.finalValue.toString()],
    ['Gain / Perte net (FCFA)', simulation.netGainOrLoss.toString()],
    ['Performance (%)', `${simulation.performancePercent} %`],
    ['Date du rapport', new Date().toISOString()],
    ['Avertissement', 'Ce document est une simulation pédagogique Bourse Facile - Non contractuelle'],
  ];

  let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
  csvContent += headers.join(';') + '\n';
  rows.forEach(row => {
    const escapedRow = row.map(val => `"${val.replace(/"/g, '""')}"`);
    csvContent += escapedRow.join(';') + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Bourse_Facile_Simulation_${simulation.companySymbol}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate CSV for Company Comparison
 */
export function exportComparisonToCSV(companies: Company[]): void {
  const headers = ['Symbole', 'Nom', 'Secteur', 'Prix (FCFA)', 'Variation (%)', 'BPA (FCFA)', 'PER', 'ROE (%)', 'PBR', 'Dividende (FCFA)', 'Rendement (%)', 'Cycle de vie'];
  
  let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
  csvContent += headers.join(';') + '\n';

  companies.forEach(c => {
    const row = [
      c.symbol,
      c.name,
      c.sector,
      c.currentPrice.toString(),
      c.dayChangePercent.toString(),
      c.eps !== undefined ? c.eps.toString() : 'N/A',
      c.per !== undefined ? c.per.toString() : 'N/A',
      c.roe !== undefined ? `${c.roe}%` : 'N/A',
      c.pbr !== undefined ? `${c.pbr}x` : 'N/A',
      c.lastDividend !== undefined ? c.lastDividend.toString() : 'N/A',
      c.dividendYield !== undefined ? c.dividendYield.toString() : 'N/A',
      c.lifecycle,
    ];
    csvContent += row.map(val => `"${val.replace(/"/g, '""')}"`).join(';') + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `BourseClair_Comparaison_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export Simulation to clean PDF using jsPDF
 */
export function exportSimulationToPDF(simulation: SimulationResult): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(30, 58, 138); // Deep blue (#1e3a8a)
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Bourse Facile', 15, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Rapport de Simulation Pédagogique - BRVM', 15, 26);

  doc.text(`Généré le: ${formatDateFrench(new Date().toISOString())}`, pageWidth - 15, 26, { align: 'right' });

  // Title Section
  let y = 48;
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${simulation.title}`, 15, y);

  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Action: ${simulation.companyName} (${simulation.companySymbol}) | Période: ${simulation.startDate} au ${simulation.endDate}`, 15, y);

  // Key Metric Cards Box
  y += 12;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(15, y, pageWidth - 30, 45, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RÉSULTAT DE LA SIMULATION', 20, y + 10);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Montant Initial Investi:`, 20, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.text(formatFCFA(simulation.initialAmount), 85, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.text(`Valeur Finale Estimée:`, 20, y + 28);
  doc.setFont('helvetica', 'bold');
  doc.text(formatFCFA(simulation.finalValue), 85, y + 28);

  doc.setFont('helvetica', 'normal');
  doc.text(`Gain / Perte Net:`, 20, y + 36);
  doc.setFont('helvetica', 'bold');
  if (simulation.netGainOrLoss >= 0) {
    doc.setTextColor(22, 101, 52); // green-800
  } else {
    doc.setTextColor(153, 27, 27); // red-800
  }
  doc.text(`${formatFCFA(simulation.netGainOrLoss)} (${formatPercent(simulation.performancePercent)})`, 85, y + 36);

  // Details
  y += 58;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Détails des Paramètres & Opérations', 15, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Prix d'achat initial: ${formatFCFA(simulation.initialPrice)}`, 20, y);
  y += 6;
  doc.text(`• Prix de clôture final: ${formatFCFA(simulation.finalPrice)}`, 20, y);
  y += 6;
  doc.text(`• Nombre total d'actions détenues: ${simulation.sharesBought}`, 20, y);
  y += 6;
  doc.text(`• Traitement des dividendes: ${simulation.dividendMode === 'REINVEST' ? 'Réinvestis en nouvelles actions' : simulation.dividendMode === 'KEEP' ? 'Conservés en trésorerie' : 'Non pris en compte'}`, 20, y);
  y += 6;
  doc.text(`• Total des dividendes distribués: ${formatFCFA(simulation.totalDividendsReceived)}`, 20, y);

  // Hypotheses
  y += 14;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Hypothèses & Mentions Pédagogiques', 15, y);

  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  simulation.hypotheses.forEach(h => {
    doc.text(`- ${h}`, 20, y);
    y += 5;
  });

  // Footer Disclaimer
  y = doc.internal.pageSize.getHeight() - 20;
  doc.setFillColor(248, 250, 252);
  doc.rect(0, y, pageWidth, 20, 'F');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Avertissement: Bourse Facile est un outil de simulation et d\'apprentissage pédagogique. Il ne s\'agit pas d\'un conseil financier ou d\'une incitation à l\'investissement.', pageWidth / 2, y + 10, { align: 'center' });

  doc.save(`Bourse_Facile_Simulation_${simulation.companySymbol}.pdf`);
}
