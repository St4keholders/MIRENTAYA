import type { Metadata } from 'next';
import PersonalizadoPage from '@/components/stakeholders/personalizado/PersonalizadoPage';

export const metadata: Metadata = {
  title: 'Diseña tu servicio · Stakeholders',
  description: 'Escoge las partes del servicio que necesitas: contabilidad, nómina, contador acompañante e infraestructura tecnológica. Agenda tu cita y un contador te atenderá.',
};

export default function Page() {
  return <PersonalizadoPage />;
}
