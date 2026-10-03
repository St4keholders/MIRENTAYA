import type { Metadata } from 'next';
import ServicioPage from '@/components/stakeholders/ServicioPage';

export const metadata: Metadata = {
  title: 'Servicio personalizado · Stakeholders',
  description: 'Constitución de empresas, requerimientos DIAN, devoluciones, declaraciones atrasadas y planeación tributaria.',
};

export default function Page() {
  return <ServicioPage id="personalizado" />;
}
