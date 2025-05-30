import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Read session cookie on every request
  const session = event.cookies.get('session');
  
  // Populate event.locals.user based on session cookie
  if (session === 'admin') {
    event.locals.user = { 
      name: 'Admin User', 
      role: 'admin' 
    };
  } else if (session) {
    // Regular user session (username stored in cookie)
    event.locals.user = { 
      name: session, 
      role: 'user' 
    };
  } else {
    // No session - user not logged in
    event.locals.user = null;
  }
  
  // Continue to route handler
  const response = await resolve(event);
  return response;
};
