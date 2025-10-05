import type { Node, Edge } from 'reactflow';
import type { FamilyMember } from '@/types/familytree';

export interface FamilyTreeExportData {
  version: string;
  exportDate: string;
  nodes: Node[];
  edges: Edge[];
  members: Record<string, FamilyMember>;
}

export const exportFamilyTree = (
  nodes: Node[],
  edges: Edge[],
  members: Record<string, FamilyMember>,
  filename?: string
) => {
  const data: FamilyTreeExportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    nodes,
    edges,
    members,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `family-tree-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importFamilyTree = (file: File): Promise<FamilyTreeExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as FamilyTreeExportData;

        // Validate data structure
        if (!data.version || !data.nodes || !data.edges || !data.members) {
          throw new Error('Invalid family tree file format');
        }

        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse family tree file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

// Export as PDF (using html2canvas and jsPDF - optional)
export const exportFamilyTreeAsPDF = async (elementId: string, filename?: string) => {
  // This requires additional libraries: html2canvas and jspdf
  // npm install html2canvas jspdf
  const html2canvas = (await import('html2canvas')).default;
  const jsPDF = (await import('jspdf')).default;

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save(filename || `family-tree-${Date.now()}.pdf`);
};