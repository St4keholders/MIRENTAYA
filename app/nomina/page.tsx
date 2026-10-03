import type { Metadata } from 'next';
import ServicioPage from '@/components/stakeholders/ServicioPage';

export const metadata: Metadata = {
  title: 'Nómina electrónica · Stakeholders',
  description: 'Liquidación de nómina, transmisión de nómina electrónica a la DIAN, PILA y prestaciones sociales.',
};

export default function Page() {
  return <ServicioPage id="nomina" />;
}
