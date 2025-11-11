export function countForAdmin(allTickets = []) {
  return allTickets.filter(t => t.status === 'open').length;
}
export function countForAgent(assigned = []) {
  return assigned.length;
}
export function countForClient(myTickets = []) {
  return myTickets.filter(t =>
    t.status === 'in_progress' || t.status === 'resolved' || t.status === 'closed'
  ).length;
}
