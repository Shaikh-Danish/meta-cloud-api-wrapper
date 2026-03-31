import type { MessageHandler } from '../registry.js';
import type { IncomingMessage, ContactCard } from '../../../types/incoming.js';

export const contactsHandler: MessageHandler<Extract<IncomingMessage, { type: 'contacts' }>> = {
  type: 'contacts',
  parse(rawMessage: any) {
    // Parse Contacts
    const parsedContacts = rawMessage.contacts.map((contact: any) => {
      const parsedContact: ContactCard = {
        name: {
          formattedName: contact.name?.formatted_name,
          firstName: contact.name?.first_name,
          lastName: contact.name?.last_name,
          middleName: contact.name?.middle_name,
          suffix: contact.name?.suffix,
          prefix: contact.name?.prefix,
        },
      };

      if (contact.addresses) {
        parsedContact.addresses = contact.addresses.map((addr: any) => ({
          street: addr.street,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
          country: addr.country,
          countryCode: addr.country_code,
          type: addr.type,
        }));
      }

      if (contact.birthday) {
        parsedContact.birthday = contact.birthday;
      }

      if (contact.emails) {
        parsedContact.emails = contact.emails.map((email: any) => ({
          email: email.email,
          type: email.type,
        }));
      }

      if (contact.org) {
        parsedContact.org = {
          company: contact.org.company,
          department: contact.org.department,
          title: contact.org.title,
        };
      }

      if (contact.phones) {
        parsedContact.phones = contact.phones.map((phone: any) => ({
          phone: phone.phone,
          waId: phone.wa_id,
          type: phone.type,
        }));
      }

      if (contact.urls) {
        parsedContact.urls = contact.urls.map((url: any) => ({
          url: url.url,
          type: url.type,
        }));
      }

      return parsedContact;
    });

    return {
      type: 'contacts',
      contacts: parsedContacts,
    };
  },
};
