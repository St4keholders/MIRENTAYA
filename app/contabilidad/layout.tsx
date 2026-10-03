import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contabilidad para Empresas | Stakeholders',
  description:
    'Un equipo contable que no te deja solo. Contador y auxiliar asignados a tu empresa para tus libros, impuestos y estados financieros con reunión semanal. Agenda tu diagnóstico gratis.',
};

export default function ContabilidadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
