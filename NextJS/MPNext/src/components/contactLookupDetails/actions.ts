'use server';

import { contactLookupDetails } from '@/providers/MinistryPlatform/Interfaces/contactInterfaces';
import { ContactService } from '@/services/contactService';

export async function getContactDetails(guid: string): Promise<contactLookupDetails> {
  try {
    if (!guid || guid.trim().length === 0) {
      throw new Error('GUID is required');
    }

    const contactService = await ContactService.getInstance();
    const contact = await contactService.getContactByGuid(guid.trim());
    
    if (!contact) {
      throw new Error('Contact not found');
    }
    
    return contact;
  } catch (error) {
    console.error('Error fetching contact details:', error);
    throw new Error('Failed to fetch contact details');
  }
}