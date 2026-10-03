import type { Metadata } from 'next';
import Landing from '@/components/stakeholders/Landing';

export const metadata: Metadata = {
  title: 'Renta persona natural · Descubre tu arquetipo tributario · Stakeholders',
  description:
    'Responde el test, descubre tu arquetipo y averigua si este año te toca declarar renta. Consulta tu fecha límite con los dos últimos dígitos de tu cédula.',
};

export default function RentaPage() {
  return <Landing />;
}
