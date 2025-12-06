/**
 * PostCardGenerator - Utility to generate visually attractive image cards for social media posts
 * Generates professional-looking cards for campaigns and events using HTML Canvas API
 */

interface CampaignCardData {
  name: string;
  description?: string;
  raised: string;
  goal: string;
  progress: number;
  donors: number;
  daysLeft?: number;
  imageUrl?: string | undefined;
}

interface EventCardData {
  name: string;
  description?: string;
  date: string;
  time?: string | undefined;
  location?: string | undefined;
  participants?: number;
  isLunar?: boolean;
  imageUrl?: string | undefined;
}

/**
 * Generate an attractive campaign card image
 */
export async function generateCampaignCard(data: CampaignCardData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Set canvas size (optimized for social media - 1200x630)
  canvas.width = 1200;
  canvas.height = 630;
  
  // Create gradient background (blue to purple)
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#1e3a8a'); // blue-900
  gradient.addColorStop(0.5, '#4f46e5'); // indigo-600
  gradient.addColorStop(1, '#7c3aed'); // violet-600
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add decorative overlay pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 100 + 50, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Header section with icon
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
  ctx.fillText('🎯 CHIẾN DỊCH GÂY QUỸ', 60, 80);
  
  // Campaign title
  ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
  const titleLines = wrapText(ctx, data.name, canvas.width - 120);
  let yPos = 160;
  titleLines.forEach(line => {
    ctx.fillText(line, 60, yPos);
    yPos += 65;
  });
  
  // Description (if provided and space allows)
  if (data.description && titleLines.length < 3) {
    ctx.font = '28px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const descLines = wrapText(ctx, data.description, canvas.width - 120).slice(0, 2);
    descLines.forEach(line => {
      ctx.fillText(line, 60, yPos);
      yPos += 36;
    });
    yPos += 40; // Increased spacing after description
  } else {
    yPos += 50; // Increased spacing after title
  }
  
  // Progress section background
  const progressBoxY = yPos;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  roundRect(ctx, 60, progressBoxY, canvas.width - 120, 180, 20);
  ctx.fill();
  
  // Progress stats
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.fillText('💰 Tiến độ gây quỹ', 90, progressBoxY + 55);
  
  // Raised amount and goal (stacked vertically to prevent overlap)
  ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Đã gây quỹ: ${data.raised}`, 90, progressBoxY + 110);
  
  ctx.font = '32px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(`Mục tiêu: ${data.goal}`, 90, progressBoxY + 150);
  
  // Progress bar
  const barY = progressBoxY + 185;
  const barWidth = canvas.width - 180;
  const barHeight = 20;
  
  // Progress bar background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  roundRect(ctx, 90, barY, barWidth, barHeight, 10);
  ctx.fill();
  
  // Progress bar fill
  const progressWidth = (data.progress / 100) * barWidth;
  const progressGradient = ctx.createLinearGradient(90, barY, 90 + progressWidth, barY);
  progressGradient.addColorStop(0, '#10b981'); // green-500
  progressGradient.addColorStop(1, '#34d399'); // green-400
  ctx.fillStyle = progressGradient;
  roundRect(ctx, 90, barY, progressWidth, barHeight, 10);
  ctx.fill();
  
  // Progress percentage
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
  const progressText = `${data.progress.toFixed(1)}%`;
  ctx.fillText(progressText, 90 + barWidth - ctx.measureText(progressText).width, barY - 10);
  
  // Bottom stats section
  const statsY = progressBoxY + 230;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
  
  // Donors
  ctx.fillText(`👥 ${data.donors} người ủng hộ`, 60, statsY);
  
  // Days left
  if (data.daysLeft !== undefined && data.daysLeft > 0) {
    const donorsText = `👥 ${data.donors} người ủng hộ`;
    const donorsWidth = ctx.measureText(donorsText).width;
    ctx.fillText(`⏰ Còn ${data.daysLeft} ngày`, 60 + donorsWidth + 80, statsY);
  }
  
  // Call to action
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  const ctaText = '💙 HÃY CÙNG CHUNG TAY ỦNG HỘ!';
  const ctaWidth = ctx.measureText(ctaText).width;
  ctx.fillText(ctaText, (canvas.width - ctaWidth) / 2, canvas.height - 60);
  
  // Convert canvas to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
}

/**
 * Generate an attractive event card image
 */
export async function generateEventCard(data: EventCardData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Set canvas size
  canvas.width = 1200;
  canvas.height = 630;
  
  // Create gradient background (orange to pink)
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#ea580c'); // orange-600
  gradient.addColorStop(0.5, '#f97316'); // orange-500
  gradient.addColorStop(1, '#ec4899'); // pink-500
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add decorative overlay pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let i = 0; i < 15; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 120 + 60, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Header section with icon
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
  ctx.fillText('🎊 SỰ KIỆN GIA TỘC', 60, 80);
  
  // Event title
  ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
  const titleLines = wrapText(ctx, data.name, canvas.width - 120);
  let yPos = 160;
  titleLines.forEach(line => {
    ctx.fillText(line, 60, yPos);
    yPos += 65;
  });
  
  // Description (if provided and space allows)
  if (data.description && titleLines.length < 3) {
    ctx.font = '28px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const descLines = wrapText(ctx, data.description, canvas.width - 120).slice(0, 2);
    descLines.forEach(line => {
      ctx.fillText(line, 60, yPos);
      yPos += 36;
    });
    yPos += 40; // Increased spacing after description
  } else {
    yPos += 50; // Increased spacing after title
  }
  
  // Event details box
  const detailsBoxY = yPos;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  roundRect(ctx, 60, detailsBoxY, canvas.width - 120, 240, 20);
  ctx.fill();
  
  // Event details
  ctx.fillStyle = '#ffffff';
  let detailY = detailsBoxY + 50;
  
  // Date
  ctx.font = 'bold 40px system-ui, -apple-system, sans-serif';
  ctx.fillText(`🗓️ ${data.date}`, 90, detailY);
  detailY += 60;
  
  // Time
  if (data.time) {
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.fillText(`🕐 ${data.time}`, 90, detailY);
    detailY += 55;
  }
  
  // Location
  if (data.location) {
    ctx.font = '32px system-ui, -apple-system, sans-serif';
    const locationLines = wrapText(ctx, `📍 ${data.location}`, canvas.width - 180, ).slice(0, 2);
    locationLines.forEach(line => {
      ctx.fillText(line, 90, detailY);
      detailY += 40;
    });
  }
  
  // Additional info icons
  const iconsY = detailsBoxY + 260;
  ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
  
  let iconX = 60;
  
  // Participants
  if (data.participants !== undefined && data.participants > 0) {
    ctx.fillText(`👥 ${data.participants} người`, iconX, iconsY);
    iconX += ctx.measureText(`👥 ${data.participants} người`).width + 60;
  }
  
  // Lunar calendar
  if (data.isLunar) {
    ctx.fillText('🌙 Lịch âm', iconX, iconsY);
  }
  
  // Call to action
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  const ctaText = '🎉 ĐỪNG BỎ LỠ SỰ KIỆN NÀY!';
  const ctaWidth = ctx.measureText(ctaText).width;
  ctx.fillText(ctaText, (canvas.width - ctaWidth) / 2, canvas.height - 60);
  
  // Convert canvas to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
}

/**
 * Helper function to wrap text to fit within a specified width
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Helper function to draw rounded rectangles
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
