import { User, UserRole } from '../types';

/**
 * Get formatted full name of the user.
 * Supports both camelCase (firstName, lastName) and snake_case (first_name, last_name).
 */
export const getUserFullName = (user: User | any): string => {
  if (!user) return 'User';

  const firstName = user.firstName || user.first_name || '';
  const lastName = user.lastName || user.last_name || '';
  const full = `${firstName} ${lastName}`.trim();

  if (full) return full;
  if (user.email) return user.email.split('@')[0];
  return 'User';
};

/**
 * Get display name formatted for role greetings.
 * Automatically prefixes "Dr." for DOCTOR role if not already prefixed.
 */
export const getUserDisplayName = (user: User | any): string => {
  const fullName = getUserFullName(user);
  const role: UserRole | string = user?.role || '';

  if (role === 'DOCTOR') {
    if (fullName.startsWith('Dr.') || fullName.startsWith('Dr ')) {
      return fullName;
    }
    return `Dr. ${fullName}`;
  }

  return fullName;
};

/**
 * Get user initials for avatar fallback (e.g. "AR" for Aryan Rai).
 */
export const getUserInitials = (user: User | any): string => {
  if (!user) return 'U';

  const firstName = user.firstName || user.first_name || '';
  const lastName = user.lastName || user.last_name || '';

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  if (user.email) {
    return user.email.slice(0, 2).toUpperCase();
  }
  return 'U';
};

/**
 * Time and Role based Greeting Message & Subtitle
 */
export const getGreetingMessage = (user: User | any) => {
  const hour = new Date().getHours();
  let timeOfDay = 'Good Morning';
  if (hour >= 12 && hour < 18) {
    timeOfDay = 'Good Afternoon';
  } else if (hour >= 18) {
    timeOfDay = 'Good Evening';
  }

  const name = getUserDisplayName(user);
  const role: UserRole | string = user?.role || '';

  switch (role) {
    case 'ADMIN':
      return {
        greeting: `${timeOfDay}, ${name} 👋`,
        subtitle: 'Welcome back to the Hospital Administration Portal.',
        badge: 'Executive Admin Portal • All Systems Nominal'
      };
    case 'DOCTOR':
      return {
        greeting: `${timeOfDay}, ${name} 👨‍⚕️`,
        subtitle: 'Your patient queue is ready for today.',
        badge: 'Clinical Practitioner Portal • On Shift'
      };
    case 'PATIENT':
      return {
        greeting: `${timeOfDay}, ${name} 👋`,
        subtitle: "Welcome back. Here's your health dashboard.",
        badge: `Patient Personal Health Portal • ID: PAT-${user?.id || '9021'}`
      };
    case 'RECEPTIONIST':
      return {
        greeting: `${timeOfDay}, ${name} 📋`,
        subtitle: 'Front Desk Operations & Patient Check-ins.',
        badge: 'Front Desk Reception Portal • Main Lobby Desk'
      };
    case 'PHARMACIST':
      return {
        greeting: `${timeOfDay}, ${name} 💊`,
        subtitle: 'Pharmacy Desk & Drug Inventory Controls.',
        badge: 'CarePulse Hospital Pharmacy & Drug Inventory'
      };
    case 'LAB_TECHNICIAN':
    case 'NURSE':
      return {
        greeting: `${timeOfDay}, ${name} 🧪`,
        subtitle: 'Pathology Laboratory & Diagnostic Queue.',
        badge: 'Pathology & Diagnostic Laboratory Portal'
      };
    default:
      return {
        greeting: `${timeOfDay}, ${name} 👋`,
        subtitle: 'Welcome to CarePulse Hospital Management System.',
        badge: 'CarePulse Central Portal'
      };
  }
};
