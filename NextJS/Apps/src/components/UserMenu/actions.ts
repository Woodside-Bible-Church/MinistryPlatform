'use server';

import { mpUserProfile } from "@/providers/MinistryPlatform/Interfaces/mpUserProfile";
import { UserService } from '@/services/userService';

export async function getCurrentUserProfile(id:string): Promise<mpUserProfile> {
  console.log('getCurrentUserProfile');
  console.log(id);
  const userService = await UserService.getInstance();
  const userProfile = await userService.getUserProfile(id);
  console.log(userProfile);
  return userProfile;
}

export async function getUserProfileByContactId(contactId: number): Promise<mpUserProfile> {
  console.log('getUserProfileByContactId');
  console.log(contactId);
  const userService = await UserService.getInstance();
  const userProfile = await userService.getUserProfileByContactId(contactId);
  console.log(userProfile);
  return userProfile;
}

export async function updateUserCongregation(contactId: number, congregationId: number): Promise<void> {
  const userService = await UserService.getInstance();
  await userService.updateWebCongregation(contactId, congregationId);
}