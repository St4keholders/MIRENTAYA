import type { Metadata } from 'next';
import NominaPage from '@/components/stakeholders/nomina/NominaPage';

export const metadata: Metadata = {
  title: 'Gestionamos la nómina de tu empresa · Stakeholders',
  description: 'Afiliaciones a salud, pensión, caja de compensación y ARL, prestaciones, liquidaciones y nómina electrónica. Agenda tu cita y recibe tu cotización.',
};

export default function Page() {
  return <NominaPage />;
}
