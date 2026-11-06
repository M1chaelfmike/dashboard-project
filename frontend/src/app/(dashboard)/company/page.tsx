import { redirect } from 'next/navigation';

export default function CompanyPageRedirect() {
  redirect('/company/list');
}