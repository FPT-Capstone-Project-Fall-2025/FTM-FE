import moment from 'moment';

/**
 * Generate recurring event instances for calendar display
 * @param event - The original event with recurrence info
 * @param startDate - Start date of the view range
 * @param endDate - End date of the view range
 * @returns Array of event instances
 */
export function generateRecurringEvents(
  event: any,
  startDate: Date,
  endDate: Date
): any[] {
  const instances: any[] = [];
  const eventStart = moment(event.startTime);
  const eventEnd = moment(event.endTime);
  const eventDuration = eventEnd.diff(eventStart);
  
  const viewStart = moment(startDate);
  const viewEnd = moment(endDate);
  
  // If not recurring, return single instance
  if (!event.recurrence || event.recurrence === 'ONCE') {
    // Only include if within view range
    if (eventStart.isSameOrBefore(viewEnd) && eventEnd.isSameOrAfter(viewStart)) {
      return [event];
    }
    return [];
  }
  
  // Determine recurrence end time
  const recurrenceEndTime = event.recurrenceEndTime 
    ? moment(event.recurrenceEndTime) 
    : null;
  
  let currentStart = eventStart.clone();
  let iterationCount = 0;
  const MAX_ITERATIONS = 1000; // Safety limit
  
  while (iterationCount < MAX_ITERATIONS) {
    // Check if we've passed the recurrence end time (if set)
    if (recurrenceEndTime && currentStart.isAfter(recurrenceEndTime)) {
      break;
    }
    
    const currentEnd = currentStart.clone().add(eventDuration, 'milliseconds');
    
    // Check if this instance is within the view range
    if (currentStart.isSameOrBefore(viewEnd) && currentEnd.isSameOrAfter(viewStart)) {
      // Create instance with new dates
      instances.push({
        ...event,
        id: `${event.id}_${currentStart.format('YYYY-MM-DD')}`, // Unique ID for each instance
        start: currentStart.format('YYYY-MM-DDTHH:mm:ss'),
        end: currentEnd.format('YYYY-MM-DDTHH:mm:ss'),
        startTime: currentStart.toISOString(),
        endTime: currentEnd.toISOString(),
        originalEventId: event.id, // Reference to original event
      });
    }
    
    // Move to next recurrence
    switch (event.recurrence) {
      case 'DAILY':
        currentStart.add(1, 'day');
        break;
      case 'WEEKLY':
        currentStart.add(1, 'week');
        break;
      case 'MONTHLY':
        currentStart.add(1, 'month');
        break;
      case 'YEARLY':
        currentStart.add(1, 'year');
        break;
      default:
        // Unknown recurrence type, break loop
        break;
    }
    
    iterationCount++;
    
    // Stop if we're way past the view end
    if (currentStart.isAfter(viewEnd)) {
      break;
    }
  }
  
  return instances;
}

/**
 * Process array of events and generate recurring instances
 * @param events - Array of events
 * @param startDate - Start date of view range
 * @param endDate - End date of view range
 * @returns Flattened array with all event instances
 */
export function processRecurringEvents(
  events: any[],
  startDate: Date,
  endDate: Date
): any[] {
  const allInstances: any[] = [];
  
  events.forEach(event => {
    const instances = generateRecurringEvents(event, startDate, endDate);
    allInstances.push(...instances);
  });
  
  return allInstances;
}

