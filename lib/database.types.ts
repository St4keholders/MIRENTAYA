export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: boolean
          pct_contador: number
          pct_desarrollo: number
          pct_ref_bajo: number
          pct_ref_sobre: number
          pct_vendedor: number
          tope: number
        }
        Insert: {
          id?: boolean
          pct_contador?: number
          pct_desarrollo?: number
          pct_ref_bajo?: number
          pct_ref_sobre?: number
          pct_vendedor?: number
          tope?: number
        }
        Update: {
          id?: boolean
          pct_contador?: number
          pct_desarrollo?: number
          pct_ref_bajo?: number
          pct_ref_sobre?: number
          pct_vendedor?: number
          tope?: number
        }
        Relationships: []
      }
      arquetipos: {
        Row: {
          descripcion: string | null
          id: number
          nombre: string
          orden_cascada: number
          slug: string
          tagline: string
          url_imagen: string | null
          url_video: string | null
        }
        Insert: {
          descripcion?: string | null
          id?: number
          nombre: string
          orden_cascada: number
          slug: string
          tagline: string
          url_imagen?: string | null
          url_video?: string | null
        }
        Update: {
          descripcion?: string | null
          id?: number
          nombre?: string
          orden_cascada?: number
          slug?: string
          tagline?: string
          url_imagen?: string | null
          url_video?: string | null
        }
        Relationships: []
      }
      calendario_vencimientos: {
        Row: {
          anio: number
          digitos_desde: string
          digitos_hasta: string
          fecha_limite: string
          id: number
        }
        Insert: {
          anio: number
          digitos_desde: string
          digitos_hasta: string
          fecha_limite: string
          id?: number
        }
        Update: {
          anio?: number
          digitos_desde?: string
          digitos_hasta?: string
          fecha_limite?: string
          id?: number
        }
        Relationships: []
      }
      citas: {
        Row: {
          celular: string
          correo: string
          created_at: string | null
          estado: string
          fecha_consulta: string
          hora_consulta: string
          id: string
          medio_contacto: string | null
          nombre: string
        }
        Insert: {
          celular: string
          correo: string
          created_at?: string | null
          estado?: string
          fecha_consulta: string
          hora_consulta: string
          id?: string
          medio_contacto?: string | null
          nombre: string
        }
        Update: {
          celular?: string
          correo?: string
          created_at?: string | null
          estado?: string
          fecha_consulta?: string
          hora_consulta?: string
          id?: string
          medio_contacto?: string | null
          nombre?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          base_amount: number
          beneficiary_id: string
          created_at: string
          id: string
          paid_at: string | null
          pct: number
          pipeline_lead_id: string
          role: string
          status: string
        }
        Insert: {
          amount: number
          base_amount: number
          beneficiary_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          pct: number
          pipeline_lead_id: string
          role: string
          status?: string
        }
        Update: {
          amount?: number
          base_amount?: number
          beneficiary_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          pct?: number
          pipeline_lead_id?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_pipeline_lead_id_fkey"
            columns: ["pipeline_lead_id"]
            isOneToOne: false
            referencedRelation: "pipeline_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      contadores: {
        Row: {
          activo: boolean
          credencial: string | null
          especialidad: string | null
          id: number
          nombre: string
          url_foto: string | null
          usuario_id: string | null
        }
        Insert: {
          activo?: boolean
          credencial?: string | null
          especialidad?: string | null
          id?: number
          nombre: string
          url_foto?: string | null
          usuario_id?: string | null
        }
        Update: {
          activo?: boolean
          credencial?: string | null
          especialidad?: string | null
          id?: number
          nombre?: string
          url_foto?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contadores_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_asiento_lineas: {
        Row: {
          asiento_id: string
          credito: number
          cuenta: string
          debito: number
          descripcion: string | null
          id: number
        }
        Insert: {
          asiento_id: string
          credito?: number
          cuenta: string
          debito?: number
          descripcion?: string | null
          id?: never
        }
        Update: {
          asiento_id?: string
          credito?: number
          cuenta?: string
          debito?: number
          descripcion?: string | null
          id?: never
        }
        Relationships: [
          {
            foreignKeyName: "erp_asiento_lineas_asiento_id_fkey"
            columns: ["asiento_id"]
            isOneToOne: false
            referencedRelation: "erp_asientos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_asiento_lineas_asiento_id_fkey"
            columns: ["asiento_id"]
            isOneToOne: false
            referencedRelation: "erp_libro_diario_v"
            referencedColumns: ["asiento_id"]
          },
          {
            foreignKeyName: "erp_asiento_lineas_cuenta_fkey"
            columns: ["cuenta"]
            isOneToOne: false
            referencedRelation: "erp_cuentas"
            referencedColumns: ["codigo"]
          },
        ]
      }
      erp_asientos: {
        Row: {
          anulado: boolean
          created_at: string
          created_by: string | null
          descripcion: string
          fecha: string
          id: string
          numero: number
          origen_id: string | null
          origen_tipo: string | null
          reversa_de: string | null
          tercero_id: string | null
          tercero_nombre: string | null
          tercero_tipo: string | null
          tipo: string
        }
        Insert: {
          anulado?: boolean
          created_at?: string
          created_by?: string | null
          descripcion: string
          fecha?: string
          id?: string
          numero?: never
          origen_id?: string | null
          origen_tipo?: string | null
          reversa_de?: string | null
          tercero_id?: string | null
          tercero_nombre?: string | null
          tercero_tipo?: string | null
          tipo: string
        }
        Update: {
          anulado?: boolean
          created_at?: string
          created_by?: string | null
          descripcion?: string
          fecha?: string
          id?: string
          numero?: never
          origen_id?: string | null
          origen_tipo?: string | null
          reversa_de?: string | null
          tercero_id?: string | null
          tercero_nombre?: string | null
          tercero_tipo?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_asientos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_asientos_reversa_de_fkey"
            columns: ["reversa_de"]
            isOneToOne: false
            referencedRelation: "erp_asientos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_asientos_reversa_de_fkey"
            columns: ["reversa_de"]
            isOneToOne: false
            referencedRelation: "erp_libro_diario_v"
            referencedColumns: ["asiento_id"]
          },
        ]
      }
      erp_clientes: {
        Row: {
          activo: boolean
          ciudad: string | null
          created_at: string
          created_by: string | null
          dias_credito: number
          direccion: string | null
          dv: string | null
          email: string | null
          id: string
          nombre: string
          nombre_comercial: string | null
          notas: string | null
          numero_documento: string
          responsable_iva: boolean
          telefono: string | null
          tipo_documento: string
          tipo_persona: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          ciudad?: string | null
          created_at?: string
          created_by?: string | null
          dias_credito?: number
          direccion?: string | null
          dv?: string | null
          email?: string | null
          id?: string
          nombre: string
          nombre_comercial?: string | null
          notas?: string | null
          numero_documento: string
          responsable_iva?: boolean
          telefono?: string | null
          tipo_documento?: string
          tipo_persona?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          ciudad?: string | null
          created_at?: string
          created_by?: string | null
          dias_credito?: number
          direccion?: string | null
          dv?: string | null
          email?: string | null
          id?: string
          nombre?: string
          nombre_comercial?: string | null
          notas?: string | null
          numero_documento?: string
          responsable_iva?: boolean
          telefono?: string | null
          tipo_documento?: string
          tipo_persona?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_clientes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_compra_items: {
        Row: {
          cantidad: number
          compra_id: string
          descripcion: string
          id: number
          iva: number | null
          iva_pct: number
          subtotal: number | null
          valor_unitario: number
        }
        Insert: {
          cantidad?: number
          compra_id: string
          descripcion: string
          id?: never
          iva?: number | null
          iva_pct?: number
          subtotal?: number | null
          valor_unitario: number
        }
        Update: {
          cantidad?: number
          compra_id?: string
          descripcion?: string
          id?: never
          iva?: number | null
          iva_pct?: number
          subtotal?: number | null
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "erp_compra_items_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "erp_compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_compra_items_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "erp_compras_v"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_compras: {
        Row: {
          created_at: string
          created_by: string | null
          cuenta_gasto: string
          descripcion: string | null
          estado: string
          fecha: string
          fecha_vencimiento: string | null
          id: string
          iva: number
          motivo_anulacion: string | null
          neto: number | null
          numero: string
          numero_factura: string | null
          proveedor_id: string
          retencion: number
          subtotal: number
          total: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cuenta_gasto?: string
          descripcion?: string | null
          estado?: string
          fecha?: string
          fecha_vencimiento?: string | null
          id?: string
          iva?: number
          motivo_anulacion?: string | null
          neto?: number | null
          numero?: string
          numero_factura?: string | null
          proveedor_id: string
          retencion?: number
          subtotal?: number
          total?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cuenta_gasto?: string
          descripcion?: string | null
          estado?: string
          fecha?: string
          fecha_vencimiento?: string | null
          id?: string
          iva?: number
          motivo_anulacion?: string | null
          neto?: number | null
          numero?: string
          numero_factura?: string | null
          proveedor_id?: string
          retencion?: number
          subtotal?: number
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_compras_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_compras_cuenta_gasto_fkey"
            columns: ["cuenta_gasto"]
            isOneToOne: false
            referencedRelation: "erp_cuentas"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "erp_compras_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "erp_proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_compras_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "erp_proveedores_v"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_cuentas: {
        Row: {
          activa: boolean
          clase: number
          codigo: string
          naturaleza: string
          nombre: string
        }
        Insert: {
          activa?: boolean
          clase: number
          codigo: string
          naturaleza: string
          nombre: string
        }
        Update: {
          activa?: boolean
          clase?: number
          codigo?: string
          naturaleza?: string
          nombre?: string
        }
        Relationships: []
      }
      erp_form_intentos: {
        Row: {
          created_at: string
          formulario: string
          id: number
          ip_hash: string
        }
        Insert: {
          created_at?: string
          formulario: string
          id?: never
          ip_hash: string
        }
        Update: {
          created_at?: string
          formulario?: string
          id?: never
          ip_hash?: string
        }
        Relationships: []
      }
      erp_formularios: {
        Row: {
          aprobado_at: string | null
          aprobado_por: string | null
          cita_at: string | null
          cliente_id: string | null
          created_at: string
          datos: Json
          direccion: string | null
          email: string | null
          empresa: string | null
          estado: string
          fecha_preferida: string | null
          formulario: string
          id: string
          ip_hash: string | null
          legacy_lead_id: string | null
          link_id: string | null
          mensaje: string | null
          modalidad: string | null
          motivo_descarte: string | null
          nombre: string
          responsable_id: string | null
          servicio: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          aprobado_at?: string | null
          aprobado_por?: string | null
          cita_at?: string | null
          cliente_id?: string | null
          created_at?: string
          datos?: Json
          direccion?: string | null
          email?: string | null
          empresa?: string | null
          estado?: string
          fecha_preferida?: string | null
          formulario: string
          id?: string
          ip_hash?: string | null
          legacy_lead_id?: string | null
          link_id?: string | null
          mensaje?: string | null
          modalidad?: string | null
          motivo_descarte?: string | null
          nombre: string
          responsable_id?: string | null
          servicio?: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          aprobado_at?: string | null
          aprobado_por?: string | null
          cita_at?: string | null
          cliente_id?: string | null
          created_at?: string
          datos?: Json
          direccion?: string | null
          email?: string | null
          empresa?: string | null
          estado?: string
          fecha_preferida?: string | null
          formulario?: string
          id?: string
          ip_hash?: string | null
          legacy_lead_id?: string | null
          link_id?: string | null
          mensaje?: string | null
          modalidad?: string | null
          motivo_descarte?: string | null
          nombre?: string
          responsable_id?: string | null
          servicio?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_formularios_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_formularios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "erp_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_formularios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "erp_clientes_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_formularios_legacy_lead_id_fkey"
            columns: ["legacy_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_formularios_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "erp_links_agenda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_formularios_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_leads: {
        Row: {
          cliente_id: string | null
          created_at: string
          created_by: string | null
          email: string | null
          empresa: string | null
          estado: string
          id: string
          mensaje: string | null
          nombre: string
          notas: string | null
          origen: string
          renta_lead_id: string | null
          responsable_id: string | null
          servicio: string
          telefono: string | null
          updated_at: string
          valor_estimado: number | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          empresa?: string | null
          estado?: string
          id?: string
          mensaje?: string | null
          nombre: string
          notas?: string | null
          origen?: string
          renta_lead_id?: string | null
          responsable_id?: string | null
          servicio?: string
          telefono?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          empresa?: string | null
          estado?: string
          id?: string
          mensaje?: string | null
          nombre?: string
          notas?: string | null
          origen?: string
          renta_lead_id?: string | null
          responsable_id?: string | null
          servicio?: string
          telefono?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_leads_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "erp_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_leads_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "erp_clientes_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_leads_renta_lead_id_fkey"
            columns: ["renta_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_leads_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_links_agenda: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          servicio: string
          slug: string
          titulo: string
          usuario_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          servicio?: string
          slug: string
          titulo: string
          usuario_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          servicio?: string
          slug?: string
          titulo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_links_agenda_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_login_intentos: {
        Row: {
          created_at: string
          email: string
          exito: boolean
          id: number
          ip_hash: string
        }
        Insert: {
          created_at?: string
          email: string
          exito: boolean
          id?: never
          ip_hash: string
        }
        Update: {
          created_at?: string
          email?: string
          exito?: boolean
          id?: never
          ip_hash?: string
        }
        Relationships: []
      }
      erp_pagos: {
        Row: {
          compra_id: string | null
          created_at: string
          created_by: string | null
          cuenta: string
          estado: string
          fecha: string
          id: string
          medio: string
          notas: string | null
          numero: string
          referencia: string | null
          tipo: string
          valor: number
          venta_id: string | null
        }
        Insert: {
          compra_id?: string | null
          created_at?: string
          created_by?: string | null
          cuenta?: string
          estado?: string
          fecha?: string
          id?: string
          medio?: string
          notas?: string | null
          numero: string
          referencia?: string | null
          tipo: string
          valor: number
          venta_id?: string | null
        }
        Update: {
          compra_id?: string | null
          created_at?: string
          created_by?: string | null
          cuenta?: string
          estado?: string
          fecha?: string
          id?: string
          medio?: string
          notas?: string | null
          numero?: string
          referencia?: string | null
          tipo?: string
          valor?: number
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_pagos_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "erp_compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_pagos_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "erp_compras_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_pagos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_pagos_cuenta_fkey"
            columns: ["cuenta"]
            isOneToOne: false
            referencedRelation: "erp_cuentas"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "erp_pagos_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "erp_ventas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_pagos_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "erp_ventas_v"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_proveedores: {
        Row: {
          activo: boolean
          banco: string | null
          ciudad: string | null
          created_at: string
          created_by: string | null
          dias_credito: number
          direccion: string | null
          dv: string | null
          email: string | null
          id: string
          nombre: string
          nombre_comercial: string | null
          notas: string | null
          numero_cuenta: string | null
          numero_documento: string
          responsable_iva: boolean
          telefono: string | null
          tipo_cuenta: string | null
          tipo_documento: string
          tipo_persona: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          banco?: string | null
          ciudad?: string | null
          created_at?: string
          created_by?: string | null
          dias_credito?: number
          direccion?: string | null
          dv?: string | null
          email?: string | null
          id?: string
          nombre: string
          nombre_comercial?: string | null
          notas?: string | null
          numero_cuenta?: string | null
          numero_documento: string
          responsable_iva?: boolean
          telefono?: string | null
          tipo_cuenta?: string | null
          tipo_documento?: string
          tipo_persona?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          banco?: string | null
          ciudad?: string | null
          created_at?: string
          created_by?: string | null
          dias_credito?: number
          direccion?: string | null
          dv?: string | null
          email?: string | null
          id?: string
          nombre?: string
          nombre_comercial?: string | null
          notas?: string | null
          numero_cuenta?: string | null
          numero_documento?: string
          responsable_iva?: boolean
          telefono?: string | null
          tipo_cuenta?: string | null
          tipo_documento?: string
          tipo_persona?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_proveedores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_venta_items: {
        Row: {
          cantidad: number
          descripcion: string
          id: number
          iva: number | null
          iva_pct: number
          subtotal: number | null
          valor_unitario: number
          venta_id: string
        }
        Insert: {
          cantidad?: number
          descripcion: string
          id?: never
          iva?: number | null
          iva_pct?: number
          subtotal?: number | null
          valor_unitario: number
          venta_id: string
        }
        Update: {
          cantidad?: number
          descripcion?: string
          id?: never
          iva?: number | null
          iva_pct?: number
          subtotal?: number | null
          valor_unitario?: number
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_venta_items_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "erp_ventas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_venta_items_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "erp_ventas_v"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_ventas: {
        Row: {
          cliente_id: string
          created_at: string
          created_by: string | null
          cuenta_ingreso: string
          descripcion: string | null
          estado: string
          fecha: string
          fecha_vencimiento: string | null
          id: string
          iva: number
          motivo_anulacion: string | null
          neto: number | null
          numero: string
          retencion: number
          servicio: string
          subtotal: number
          total: number | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          created_by?: string | null
          cuenta_ingreso?: string
          descripcion?: string | null
          estado?: string
          fecha?: string
          fecha_vencimiento?: string | null
          id?: string
          iva?: number
          motivo_anulacion?: string | null
          neto?: number | null
          numero?: string
          retencion?: number
          servicio?: string
          subtotal?: number
          total?: number | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          cuenta_ingreso?: string
          descripcion?: string | null
          estado?: string
          fecha?: string
          fecha_vencimiento?: string | null
          id?: string
          iva?: number
          motivo_anulacion?: string | null
          neto?: number | null
          numero?: string
          retencion?: number
          servicio?: string
          subtotal?: number
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "erp_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "erp_clientes_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_ventas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_ventas_cuenta_ingreso_fkey"
            columns: ["cuenta_ingreso"]
            isOneToOne: false
            referencedRelation: "erp_cuentas"
            referencedColumns: ["codigo"]
          },
        ]
      }
      lead_requests: {
        Row: {
          contador_id: string
          id: string
          pipeline_lead_id: string
          requested_at: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          contador_id: string
          id?: string
          pipeline_lead_id: string
          requested_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          contador_id?: string
          id?: string
          pipeline_lead_id?: string
          requested_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_requests_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_requests_pipeline_lead_id_fkey"
            columns: ["pipeline_lead_id"]
            isOneToOne: false
            referencedRelation: "pipeline_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          arquetipo_id: number | null
          barra_creditos: number
          barra_ingresos: number
          barra_movimientos: number
          barra_patrimonio: number
          cedula: string
          celular: string | null
          contador_id: string | null
          correo: string | null
          created_at: string | null
          debe_declarar: boolean
          edad: number
          estado: string
          etapa: string
          extemporaneo: boolean
          fecha_vencimiento: string | null
          id: string
          nombre: string
          ocupacion: string
          pagado: boolean
          referrer_id: string | null
          seller_id: string | null
          slug_publico: string
          source: string | null
          topes_superados: string[]
          updated_at: string | null
          valor_declaracion: number | null
        }
        Insert: {
          arquetipo_id?: number | null
          barra_creditos: number
          barra_ingresos: number
          barra_movimientos: number
          barra_patrimonio: number
          cedula: string
          celular?: string | null
          contador_id?: string | null
          correo?: string | null
          created_at?: string | null
          debe_declarar: boolean
          edad: number
          estado?: string
          etapa?: string
          extemporaneo?: boolean
          fecha_vencimiento?: string | null
          id?: string
          nombre: string
          ocupacion: string
          pagado?: boolean
          referrer_id?: string | null
          seller_id?: string | null
          slug_publico?: string
          source?: string | null
          topes_superados?: string[]
          updated_at?: string | null
          valor_declaracion?: number | null
        }
        Update: {
          arquetipo_id?: number | null
          barra_creditos?: number
          barra_ingresos?: number
          barra_movimientos?: number
          barra_patrimonio?: number
          cedula?: string
          celular?: string | null
          contador_id?: string | null
          correo?: string | null
          created_at?: string | null
          debe_declarar?: boolean
          edad?: number
          estado?: string
          etapa?: string
          extemporaneo?: boolean
          fecha_vencimiento?: string | null
          id?: string
          nombre?: string
          ocupacion?: string
          pagado?: boolean
          referrer_id?: string | null
          seller_id?: string | null
          slug_publico?: string
          source?: string | null
          topes_superados?: string[]
          updated_at?: string | null
          valor_declaracion?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_arquetipo_id_fkey"
            columns: ["arquetipo_id"]
            isOneToOne: false
            referencedRelation: "arquetipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_in_cents: number
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          lead_id: string | null
          lead_slug: string | null
          payment_method_type: string | null
          reference: string
          status: string
          updated_at: string
          wompi_transaction_id: string | null
        }
        Insert: {
          amount_in_cents: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          lead_id?: string | null
          lead_slug?: string | null
          payment_method_type?: string | null
          reference: string
          status?: string
          updated_at?: string
          wompi_transaction_id?: string | null
        }
        Update: {
          amount_in_cents?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          lead_id?: string | null
          lead_slug?: string | null
          payment_method_type?: string | null
          reference?: string
          status?: string
          updated_at?: string
          wompi_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      parametros_fiscales: {
        Row: {
          anio_gravable: number
          created_at: string | null
          edad_max_mochilero: number
          edad_min_mochilero: number
          factor_penalizacion_compras: number
          id: number
          ratio_cuota_gladiador: number
          tope_compras: number
          tope_consignaciones: number
          tope_ingresos: number
          tope_patrimonio: number
          tope_tc: number
          umbral_ingreso_mago: number
          uvt: number
        }
        Insert: {
          anio_gravable: number
          created_at?: string | null
          edad_max_mochilero?: number
          edad_min_mochilero?: number
          factor_penalizacion_compras?: number
          id?: number
          ratio_cuota_gladiador?: number
          tope_compras: number
          tope_consignaciones: number
          tope_ingresos: number
          tope_patrimonio: number
          tope_tc: number
          umbral_ingreso_mago?: number
          uvt: number
        }
        Update: {
          anio_gravable?: number
          created_at?: string | null
          edad_max_mochilero?: number
          edad_min_mochilero?: number
          factor_penalizacion_compras?: number
          id?: number
          ratio_cuota_gladiador?: number
          tope_compras?: number
          tope_consignaciones?: number
          tope_ingresos?: number
          tope_patrimonio?: number
          tope_tc?: number
          umbral_ingreso_mago?: number
          uvt?: number
        }
        Relationships: []
      }
      pipeline_leads: {
        Row: {
          anticipo_paid_at: string | null
          assigned_contador_id: string | null
          created_at: string
          created_by: string | null
          declaration_amount: number | null
          email: string | null
          full_name: string
          id: string
          lead_id: string | null
          phone: string | null
          referrer_id: string | null
          seller_id: string | null
          source: string
          stage: string
          updated_at: string
        }
        Insert: {
          anticipo_paid_at?: string | null
          assigned_contador_id?: string | null
          created_at?: string
          created_by?: string | null
          declaration_amount?: number | null
          email?: string | null
          full_name: string
          id?: string
          lead_id?: string | null
          phone?: string | null
          referrer_id?: string | null
          seller_id?: string | null
          source?: string
          stage?: string
          updated_at?: string
        }
        Update: {
          anticipo_paid_at?: string | null
          assigned_contador_id?: string | null
          created_at?: string
          created_by?: string | null
          declaration_amount?: number | null
          email?: string | null
          full_name?: string
          id?: string
          lead_id?: string | null
          phone?: string | null
          referrer_id?: string | null
          seller_id?: string | null
          source?: string
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_leads_assigned_contador_id_fkey"
            columns: ["assigned_contador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_leads_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_leads_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_events: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          event_type: string
          id: string
          pipeline_lead_id: string | null
          referrer_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          event_type: string
          id?: string
          pipeline_lead_id?: string | null
          referrer_id: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          event_type?: string
          id?: string
          pipeline_lead_id?: string | null
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_events_pipeline_lead_id_fkey"
            columns: ["pipeline_lead_id"]
            isOneToOne: false
            referencedRelation: "pipeline_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_events_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      respuestas: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          payload: Json
          version_motor: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          payload: Json
          version_motor: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          payload?: Json
          version_motor?: string
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          activo: boolean
          created_at: string | null
          email: string
          id: string
          nombre: string
          password_algo: string
          password_hash: string | null
          payout_account_number: string | null
          payout_account_type: string | null
          payout_bank: string | null
          payout_doc_id: string | null
          phone: string | null
          referral_slug: string | null
          rol: string
        }
        Insert: {
          activo?: boolean
          created_at?: string | null
          email: string
          id?: string
          nombre: string
          password_algo?: string
          password_hash?: string | null
          payout_account_number?: string | null
          payout_account_type?: string | null
          payout_bank?: string | null
          payout_doc_id?: string | null
          phone?: string | null
          referral_slug?: string | null
          rol?: string
        }
        Update: {
          activo?: boolean
          created_at?: string | null
          email?: string
          id?: string
          nombre?: string
          password_algo?: string
          password_hash?: string | null
          payout_account_number?: string | null
          payout_account_type?: string | null
          payout_bank?: string | null
          payout_doc_id?: string | null
          phone?: string | null
          referral_slug?: string | null
          rol?: string
        }
        Relationships: []
      }
      ventas: {
        Row: {
          abono_consulta: number
          contador_id: number | null
          created_at: string | null
          estado: string
          fecha_consulta: string | null
          id: string
          lead_id: string
          medio_contacto: string | null
          nombre_cliente: string | null
          pago_confirmado: boolean
          precio_servicio: number | null
          referencia_pago: string | null
          saldo_pendiente: number | null
          updated_at: string | null
        }
        Insert: {
          abono_consulta?: number
          contador_id?: number | null
          created_at?: string | null
          estado?: string
          fecha_consulta?: string | null
          id?: string
          lead_id: string
          medio_contacto?: string | null
          nombre_cliente?: string | null
          pago_confirmado?: boolean
          precio_servicio?: number | null
          referencia_pago?: string | null
          saldo_pendiente?: number | null
          updated_at?: string | null
        }
        Update: {
          abono_consulta?: number
          contador_id?: number | null
          created_at?: string | null
          estado?: string
          fecha_consulta?: string | null
          id?: string
          lead_id?: string
          medio_contacto?: string | null
          nombre_cliente?: string | null
          pago_confirmado?: boolean
          precio_servicio?: number | null
          referencia_pago?: string | null
          saldo_pendiente?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      erp_clientes_v: {
        Row: {
          activo: boolean | null
          ciudad: string | null
          created_at: string | null
          created_by: string | null
          dias_credito: number | null
          direccion: string | null
          dv: string | null
          email: string | null
          id: string | null
          nombre: string | null
          nombre_comercial: string | null
          notas: string | null
          num_ventas: number | null
          numero_documento: string | null
          responsable_iva: boolean | null
          saldo: number | null
          saldo_vencido: number | null
          telefono: string | null
          tipo_documento: string | null
          tipo_persona: string | null
          total_facturado: number | null
          ultima_venta: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_clientes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_compras_v: {
        Row: {
          created_at: string | null
          created_by: string | null
          cuenta_gasto: string | null
          cuenta_gasto_nombre: string | null
          descripcion: string | null
          estado: string | null
          estado_pago: string | null
          fecha: string | null
          fecha_vencimiento: string | null
          id: string | null
          iva: number | null
          motivo_anulacion: string | null
          neto: number | null
          numero: string | null
          numero_factura: string | null
          pagado: number | null
          proveedor_documento: string | null
          proveedor_id: string | null
          proveedor_nombre: string | null
          proveedor_tipo_documento: string | null
          retencion: number | null
          saldo: number | null
          subtotal: number | null
          total: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_compras_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_compras_cuenta_gasto_fkey"
            columns: ["cuenta_gasto"]
            isOneToOne: false
            referencedRelation: "erp_cuentas"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "erp_compras_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "erp_proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_compras_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "erp_proveedores_v"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_libro_diario_v: {
        Row: {
          anulado: boolean | null
          asiento_id: string | null
          created_at: string | null
          credito: number | null
          cuenta: string | null
          cuenta_nombre: string | null
          debito: number | null
          descripcion: string | null
          fecha: string | null
          linea_descripcion: string | null
          linea_id: number | null
          numero: number | null
          origen_id: string | null
          origen_tipo: string | null
          tercero_id: string | null
          tercero_nombre: string | null
          tercero_tipo: string | null
          tipo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_asiento_lineas_cuenta_fkey"
            columns: ["cuenta"]
            isOneToOne: false
            referencedRelation: "erp_cuentas"
            referencedColumns: ["codigo"]
          },
        ]
      }
      erp_proveedores_v: {
        Row: {
          activo: boolean | null
          banco: string | null
          ciudad: string | null
          created_at: string | null
          created_by: string | null
          dias_credito: number | null
          direccion: string | null
          dv: string | null
          email: string | null
          id: string | null
          nombre: string | null
          nombre_comercial: string | null
          notas: string | null
          num_compras: number | null
          numero_cuenta: string | null
          numero_documento: string | null
          responsable_iva: boolean | null
          saldo: number | null
          saldo_vencido: number | null
          telefono: string | null
          tipo_cuenta: string | null
          tipo_documento: string | null
          tipo_persona: string | null
          total_comprado: number | null
          ultima_compra: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_proveedores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_ventas_v: {
        Row: {
          cliente_documento: string | null
          cliente_id: string | null
          cliente_nombre: string | null
          cliente_tipo_documento: string | null
          created_at: string | null
          created_by: string | null
          cuenta_ingreso: string | null
          descripcion: string | null
          estado: string | null
          estado_pago: string | null
          fecha: string | null
          fecha_vencimiento: string | null
          id: string | null
          iva: number | null
          motivo_anulacion: string | null
          neto: number | null
          numero: string | null
          pagado: number | null
          retencion: number | null
          saldo: number | null
          servicio: string | null
          subtotal: number | null
          total: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "erp_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "erp_clientes_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_ventas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_ventas_cuenta_ingreso_fkey"
            columns: ["cuenta_ingreso"]
            isOneToOne: false
            referencedRelation: "erp_cuentas"
            referencedColumns: ["codigo"]
          },
        ]
      }
    }
    Functions: {
      authenticate_user: {
        Args: { p_email: string; p_password_hash: string }
        Returns: Json
      }
      erp__nuevo_asiento: {
        Args: {
          p_created_by: string
          p_descripcion: string
          p_fecha: string
          p_lineas: Json
          p_origen_id: string
          p_origen_tipo: string
          p_reversa_de?: string
          p_tercero_id: string
          p_tercero_nombre: string
          p_tercero_tipo: string
          p_tipo: string
        }
        Returns: string
      }
      erp__reversar: {
        Args: {
          p_motivo: string
          p_origen_id: string
          p_origen_tipo: string
          p_usuario: string
        }
        Returns: undefined
      }
      erp_anular_compra: {
        Args: { p_id: string; p_motivo?: string; p_usuario: string }
        Returns: undefined
      }
      erp_anular_pago: {
        Args: { p_id: string; p_motivo?: string; p_usuario: string }
        Returns: undefined
      }
      erp_anular_venta: {
        Args: { p_id: string; p_motivo?: string; p_usuario: string }
        Returns: undefined
      }
      erp_crear_asiento_manual: { Args: { p: Json }; Returns: string }
      erp_crear_compra: { Args: { p: Json }; Returns: string }
      erp_crear_venta: { Args: { p: Json }; Returns: string }
      erp_registrar_pago: { Args: { p: Json }; Returns: string }
      generate_commissions: { Args: { p_lead_id: string }; Returns: undefined }
      generate_referral_slug: { Args: { nombre: string }; Returns: string }
      list_leads: { Args: never; Returns: Json[] }
      list_usuarios: { Args: never; Returns: Json[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
