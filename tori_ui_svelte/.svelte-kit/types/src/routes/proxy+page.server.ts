// @ts-nocheck
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = ({ locals }: Parameters<PageServerLoad>[0]) => {
  // If user is not logged in, redirect to login
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  // User is authenticated, continue to main page
  return {};
};
