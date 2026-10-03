import type { Metadata } from 'next';
import ServicioPage from '@/components/stakeholders/ServicioPage';

export const metadata: Metadata = {
  title: 'Contabilidad para empresas · Stakeholders',
  description: 'Registro contable, declaraciones de IVA, retención e ICA, información exógena y estados financieros para tu empresa.',
};

export default function Page() {
  return <ServicioPage id="contabilidad" />;
}
