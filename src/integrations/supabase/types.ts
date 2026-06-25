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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      algar_products_cache: {
        Row: {
          created_at: string
          fetched_at: string
          id: string
          name: string
          raw: Json
          sku: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fetched_at?: string
          id?: string
          name: string
          raw?: Json
          sku: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fetched_at?: string
          id?: string
          name?: string
          raw?: Json
          sku?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          active: boolean
          created_at: string
          cta_text: string
          cta_url: string
          delay_seconds: number
          display_pages: Json
          expires_at: string | null
          frequency: string
          id: string
          image_url: string
          popup_style: string
          sort_order: number
          starts_at: string | null
          text: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta_text?: string
          cta_url?: string
          delay_seconds?: number
          display_pages?: Json
          expires_at?: string | null
          frequency?: string
          id?: string
          image_url?: string
          popup_style?: string
          sort_order?: number
          starts_at?: string | null
          text: string
          title?: string
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cta_text?: string
          cta_url?: string
          delay_seconds?: number
          display_pages?: Json
          expires_at?: string | null
          frequency?: string
          id?: string
          image_url?: string
          popup_style?: string
          sort_order?: number
          starts_at?: string | null
          text?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      asaas_config: {
        Row: {
          active: boolean
          auto_create_customer: boolean
          created_at: string
          default_billing_type: string
          default_due_days: number
          environment: string
          id: string
          notification_disabled: boolean
          production_api_key: string | null
          production_webhook_token: string | null
          sandbox_api_key: string | null
          sandbox_webhook_token: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          auto_create_customer?: boolean
          created_at?: string
          default_billing_type?: string
          default_due_days?: number
          environment?: string
          id?: string
          notification_disabled?: boolean
          production_api_key?: string | null
          production_webhook_token?: string | null
          sandbox_api_key?: string | null
          sandbox_webhook_token?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          auto_create_customer?: boolean
          created_at?: string
          default_billing_type?: string
          default_due_days?: number
          environment?: string
          id?: string
          notification_disabled?: boolean
          production_api_key?: string | null
          production_webhook_token?: string | null
          sandbox_api_key?: string | null
          sandbox_webhook_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      asaas_logs: {
        Row: {
          created_at: string
          created_by: string | null
          duration_ms: number | null
          endpoint: string
          environment: string
          error_message: string | null
          id: string
          method: string
          request_payload: Json | null
          response_payload: Json | null
          status_code: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          endpoint: string
          environment: string
          error_message?: string | null
          id?: string
          method: string
          request_payload?: Json | null
          response_payload?: Json | null
          status_code?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          endpoint?: string
          environment?: string
          error_message?: string | null
          id?: string
          method?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status_code?: number | null
        }
        Relationships: []
      }
      asaas_webhooks: {
        Row: {
          environment: string | null
          event_id: string
          event_type: string
          object_id: string | null
          payload: Json
          processed_at: string | null
          received_at: string
        }
        Insert: {
          environment?: string | null
          event_id: string
          event_type: string
          object_id?: string | null
          payload: Json
          processed_at?: string | null
          received_at?: string
        }
        Update: {
          environment?: string | null
          event_id?: string
          event_type?: string
          object_id?: string | null
          payload?: Json
          processed_at?: string | null
          received_at?: string
        }
        Relationships: []
      }
      banner_clicks: {
        Row: {
          banner_id: string
          banner_type: string
          created_at: string
          id: string
          link_url: string
          page_path: string
          session_id: string
          user_agent: string
        }
        Insert: {
          banner_id: string
          banner_type: string
          created_at?: string
          id?: string
          link_url?: string
          page_path?: string
          session_id?: string
          user_agent?: string
        }
        Update: {
          banner_id?: string
          banner_type?: string
          created_at?: string
          id?: string
          link_url?: string
          page_path?: string
          session_id?: string
          user_agent?: string
        }
        Relationships: []
      }
      bio_cards: {
        Row: {
          active: boolean
          alt: string
          created_at: string
          id: string
          image_url: string
          link_url: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          alt?: string
          created_at?: string
          id?: string
          image_url?: string
          link_url?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          alt?: string
          created_at?: string
          id?: string
          image_url?: string
          link_url?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      bio_settings: {
        Row: {
          avatar_url: string
          created_at: string
          description: string
          facebook_url: string
          footer_text: string
          id: string
          instagram_url: string
          tiktok_url: string
          title: string
          updated_at: string
          whatsapp_url: string
          youtube_url: string
        }
        Insert: {
          avatar_url?: string
          created_at?: string
          description?: string
          facebook_url?: string
          footer_text?: string
          id?: string
          instagram_url?: string
          tiktok_url?: string
          title?: string
          updated_at?: string
          whatsapp_url?: string
          youtube_url?: string
        }
        Update: {
          avatar_url?: string
          created_at?: string
          description?: string
          facebook_url?: string
          footer_text?: string
          id?: string
          instagram_url?: string
          tiktok_url?: string
          title?: string
          updated_at?: string
          whatsapp_url?: string
          youtube_url?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          active: boolean
          author_avatar_url: string
          author_first_name: string
          author_instagram: string
          author_last_name: string
          category: string
          category_icon: string
          content: string
          created_at: string
          date_label: string
          excerpt: string
          id: string
          image_url: string
          read_time: string
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          author_avatar_url?: string
          author_first_name?: string
          author_instagram?: string
          author_last_name?: string
          category?: string
          category_icon?: string
          content?: string
          created_at?: string
          date_label?: string
          excerpt?: string
          id?: string
          image_url?: string
          read_time?: string
          slug?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          author_avatar_url?: string
          author_first_name?: string
          author_instagram?: string
          author_last_name?: string
          category?: string
          category_icon?: string
          content?: string
          created_at?: string
          date_label?: string
          excerpt?: string
          id?: string
          image_url?: string
          read_time?: string
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      checkout_events: {
        Row: {
          cielo_change_type: number | null
          cielo_status: number | null
          created_at: string
          id: string
          message: string | null
          order_id: string
          payload: Json | null
          source: string
        }
        Insert: {
          cielo_change_type?: number | null
          cielo_status?: number | null
          created_at?: string
          id?: string
          message?: string | null
          order_id: string
          payload?: Json | null
          source: string
        }
        Update: {
          cielo_change_type?: number | null
          cielo_status?: number | null
          created_at?: string
          id?: string
          message?: string | null
          order_id?: string
          payload?: Json | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "checkout_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_orders: {
        Row: {
          algar_mobileline_id: string | null
          algar_service_id: string | null
          algar_subscriber_id: string | null
          authentication_url: string | null
          boleto_bar_code: string | null
          boleto_digitable_line: string | null
          boleto_due_date: string | null
          boleto_url: string | null
          card_brand: string | null
          card_last4: string | null
          cielo_auth_code: string | null
          cielo_payment_id: string | null
          cielo_proof_of_sale: string | null
          created_at: string
          customer: Json
          customer_birthdate: string | null
          customer_doc: string | null
          customer_email: string | null
          desired_msisdn_prefix: string | null
          discount_cents: number
          esim_activation_code: string | null
          esim_qr_url: string | null
          iccid: string | null
          id: string
          installments: number | null
          items: Json
          last_error: Json | null
          merchant_order_id: string
          msisdn: string | null
          notification_sent_at: string | null
          payment_method: string
          pix_expires_at: string | null
          pix_qr_code: string | null
          pix_qr_string: string | null
          portability: Json | null
          provider: string | null
          provider_attempts: Json
          provider_payment_id: string | null
          provisioned_at: string | null
          provisioning_attempts: number
          provisioning_last_error: string | null
          provisioning_status: Database["public"]["Enums"]["provisioning_status"]
          raw_response: Json | null
          return_url: string | null
          shipping_address: Json | null
          sim_kind: Database["public"]["Enums"]["sim_kind"] | null
          status: Database["public"]["Enums"]["checkout_status"]
          subtotal_cents: number
          total_cents: number
          tracking_code: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          algar_mobileline_id?: string | null
          algar_service_id?: string | null
          algar_subscriber_id?: string | null
          authentication_url?: string | null
          boleto_bar_code?: string | null
          boleto_digitable_line?: string | null
          boleto_due_date?: string | null
          boleto_url?: string | null
          card_brand?: string | null
          card_last4?: string | null
          cielo_auth_code?: string | null
          cielo_payment_id?: string | null
          cielo_proof_of_sale?: string | null
          created_at?: string
          customer: Json
          customer_birthdate?: string | null
          customer_doc?: string | null
          customer_email?: string | null
          desired_msisdn_prefix?: string | null
          discount_cents?: number
          esim_activation_code?: string | null
          esim_qr_url?: string | null
          iccid?: string | null
          id?: string
          installments?: number | null
          items: Json
          last_error?: Json | null
          merchant_order_id: string
          msisdn?: string | null
          notification_sent_at?: string | null
          payment_method: string
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          pix_qr_string?: string | null
          portability?: Json | null
          provider?: string | null
          provider_attempts?: Json
          provider_payment_id?: string | null
          provisioned_at?: string | null
          provisioning_attempts?: number
          provisioning_last_error?: string | null
          provisioning_status?: Database["public"]["Enums"]["provisioning_status"]
          raw_response?: Json | null
          return_url?: string | null
          shipping_address?: Json | null
          sim_kind?: Database["public"]["Enums"]["sim_kind"] | null
          status?: Database["public"]["Enums"]["checkout_status"]
          subtotal_cents?: number
          total_cents: number
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          algar_mobileline_id?: string | null
          algar_service_id?: string | null
          algar_subscriber_id?: string | null
          authentication_url?: string | null
          boleto_bar_code?: string | null
          boleto_digitable_line?: string | null
          boleto_due_date?: string | null
          boleto_url?: string | null
          card_brand?: string | null
          card_last4?: string | null
          cielo_auth_code?: string | null
          cielo_payment_id?: string | null
          cielo_proof_of_sale?: string | null
          created_at?: string
          customer?: Json
          customer_birthdate?: string | null
          customer_doc?: string | null
          customer_email?: string | null
          desired_msisdn_prefix?: string | null
          discount_cents?: number
          esim_activation_code?: string | null
          esim_qr_url?: string | null
          iccid?: string | null
          id?: string
          installments?: number | null
          items?: Json
          last_error?: Json | null
          merchant_order_id?: string
          msisdn?: string | null
          notification_sent_at?: string | null
          payment_method?: string
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          pix_qr_string?: string | null
          portability?: Json | null
          provider?: string | null
          provider_attempts?: Json
          provider_payment_id?: string | null
          provisioned_at?: string | null
          provisioning_attempts?: number
          provisioning_last_error?: string | null
          provisioning_status?: Database["public"]["Enums"]["provisioning_status"]
          raw_response?: Json | null
          return_url?: string | null
          shipping_address?: Json | null
          sim_kind?: Database["public"]["Enums"]["sim_kind"] | null
          status?: Database["public"]["Enums"]["checkout_status"]
          subtotal_cents?: number
          total_cents?: number
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cielo_config: {
        Row: {
          active: boolean
          antifraud_enabled: boolean
          antifraud_provider: string | null
          created_at: string
          default_capture: boolean
          default_soft_descriptor: string | null
          environment: string
          id: string
          merchant_id_production: string | null
          merchant_id_sandbox: string | null
          merchant_key_production: string | null
          merchant_key_sandbox: string | null
          provider_boleto: string
          provider_credit: string
          provider_debit: string
          provider_pix: string
          provider_pix_production: string
          provider_pix_sandbox: string
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          active?: boolean
          antifraud_enabled?: boolean
          antifraud_provider?: string | null
          created_at?: string
          default_capture?: boolean
          default_soft_descriptor?: string | null
          environment?: string
          id?: string
          merchant_id_production?: string | null
          merchant_id_sandbox?: string | null
          merchant_key_production?: string | null
          merchant_key_sandbox?: string | null
          provider_boleto?: string
          provider_credit?: string
          provider_debit?: string
          provider_pix?: string
          provider_pix_production?: string
          provider_pix_sandbox?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          active?: boolean
          antifraud_enabled?: boolean
          antifraud_provider?: string | null
          created_at?: string
          default_capture?: boolean
          default_soft_descriptor?: string | null
          environment?: string
          id?: string
          merchant_id_production?: string | null
          merchant_id_sandbox?: string | null
          merchant_key_production?: string | null
          merchant_key_sandbox?: string | null
          provider_boleto?: string
          provider_credit?: string
          provider_debit?: string
          provider_pix?: string
          provider_pix_production?: string
          provider_pix_sandbox?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      cielo_logs: {
        Row: {
          created_at: string
          direction: string
          duration_ms: number | null
          endpoint: string | null
          error: string | null
          id: string
          merchant_order_id: string | null
          method: string | null
          payment_id: string | null
          request_body: Json | null
          request_id: string | null
          response_body: Json | null
          status_code: number | null
        }
        Insert: {
          created_at?: string
          direction: string
          duration_ms?: number | null
          endpoint?: string | null
          error?: string | null
          id?: string
          merchant_order_id?: string | null
          method?: string | null
          payment_id?: string | null
          request_body?: Json | null
          request_id?: string | null
          response_body?: Json | null
          status_code?: number | null
        }
        Update: {
          created_at?: string
          direction?: string
          duration_ms?: number | null
          endpoint?: string | null
          error?: string | null
          id?: string
          merchant_order_id?: string | null
          method?: string | null
          payment_id?: string | null
          request_body?: Json | null
          request_id?: string | null
          response_body?: Json | null
          status_code?: number | null
        }
        Relationships: []
      }
      cielo_webhooks: {
        Row: {
          change_type: number | null
          created_at: string
          error: string | null
          id: string
          payload: Json | null
          payment_id: string | null
          processed: boolean
          processed_at: string | null
          recurrent_payment_id: string | null
        }
        Insert: {
          change_type?: number | null
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          payment_id?: string | null
          processed?: boolean
          processed_at?: string | null
          recurrent_payment_id?: string | null
        }
        Update: {
          change_type?: number | null
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          payment_id?: string | null
          processed?: boolean
          processed_at?: string | null
          recurrent_payment_id?: string | null
        }
        Relationships: []
      }
      combo_options: {
        Row: {
          active: boolean
          badge_color: string
          badge_label: string
          category: string
          created_at: string
          description: string
          id: string
          label: string
          price_cents: number
          recommended: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          badge_color?: string
          badge_label?: string
          category: string
          created_at?: string
          description?: string
          id?: string
          label: string
          price_cents?: number
          recommended?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          badge_color?: string
          badge_label?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          label?: string
          price_cents?: number
          recommended?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      commercial_proposals: {
        Row: {
          created_at: string
          customer_cep: string
          customer_city: string
          customer_complement: string
          customer_doc: string
          customer_email: string
          customer_name: string
          customer_neighborhood: string
          customer_number: string
          customer_phone: string
          customer_street: string
          customer_uf: string
          discount_cents: number
          fidelity: string
          id: string
          installation_fee_cents: number
          installation_waived: boolean
          items: Json
          notes: string
          number: number
          payment_method: string
          pdf_url: string | null
          seller_email: string
          seller_id: string | null
          seller_name: string
          seller_phone: string
          status: string
          subtotal_cents: number
          total_cents: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          customer_cep?: string
          customer_city?: string
          customer_complement?: string
          customer_doc?: string
          customer_email?: string
          customer_name: string
          customer_neighborhood?: string
          customer_number?: string
          customer_phone?: string
          customer_street?: string
          customer_uf?: string
          discount_cents?: number
          fidelity?: string
          id?: string
          installation_fee_cents?: number
          installation_waived?: boolean
          items?: Json
          notes?: string
          number?: number
          payment_method?: string
          pdf_url?: string | null
          seller_email?: string
          seller_id?: string | null
          seller_name?: string
          seller_phone?: string
          status?: string
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          customer_cep?: string
          customer_city?: string
          customer_complement?: string
          customer_doc?: string
          customer_email?: string
          customer_name?: string
          customer_neighborhood?: string
          customer_number?: string
          customer_phone?: string
          customer_street?: string
          customer_uf?: string
          discount_cents?: number
          fidelity?: string
          id?: string
          installation_fee_cents?: number
          installation_waived?: boolean
          items?: Json
          notes?: string
          number?: number
          payment_method?: string
          pdf_url?: string | null
          seller_email?: string
          seller_id?: string | null
          seller_name?: string
          seller_phone?: string
          status?: string
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          label: string
          max_uses: number
          show_in_banner: boolean
          show_in_checkout: boolean
          show_in_exit_popup: boolean
          sort_order: number
          starts_at: string | null
          updated_at: string
          uses_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          label?: string
          max_uses?: number
          show_in_banner?: boolean
          show_in_checkout?: boolean
          show_in_exit_popup?: boolean
          sort_order?: number
          starts_at?: string | null
          updated_at?: string
          uses_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          label?: string
          max_uses?: number
          show_in_banner?: boolean
          show_in_checkout?: boolean
          show_in_exit_popup?: boolean
          sort_order?: number
          starts_at?: string | null
          updated_at?: string
          uses_count?: number
        }
        Relationships: []
      }
      coverage_ceps: {
        Row: {
          active: boolean
          cep_end: string
          cep_start: string
          city_id: string
          created_at: string
          id: string
          neighborhood: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cep_end: string
          cep_start: string
          city_id: string
          created_at?: string
          id?: string
          neighborhood?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cep_end?: string
          cep_start?: string
          city_id?: string
          created_at?: string
          id?: string
          neighborhood?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coverage_ceps_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "coverage_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_cities: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          state: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          state?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          lead_id: string
          payload: Json
          type: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          lead_id: string
          payload?: Json
          type: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          payload?: Json
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          assigned_to: string | null
          best_time: string
          cep: string
          city: string
          combo_discount_cents: number
          complement: string
          coupon_code: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          items: Json
          neighborhood: string
          next_action_at: string | null
          next_action_note: string
          notes: string
          number: string
          source: string
          stage: string
          stage_order: number
          street: string
          subtotal_cents: number
          tags: Json
          total_cents: number
          uf: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          best_time?: string
          cep?: string
          city?: string
          combo_discount_cents?: number
          complement?: string
          coupon_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          items?: Json
          neighborhood?: string
          next_action_at?: string | null
          next_action_note?: string
          notes?: string
          number?: string
          source?: string
          stage?: string
          stage_order?: number
          street?: string
          subtotal_cents?: number
          tags?: Json
          total_cents?: number
          uf?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          best_time?: string
          cep?: string
          city?: string
          combo_discount_cents?: number
          complement?: string
          coupon_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          items?: Json
          neighborhood?: string
          next_action_at?: string | null
          next_action_note?: string
          notes?: string
          number?: string
          source?: string
          stage?: string
          stage_order?: number
          street?: string
          subtotal_cents?: number
          tags?: Json
          total_cents?: number
          uf?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_roles: {
        Row: {
          color: string
          created_at: string
          description: string
          id: string
          is_system: boolean
          label: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          id?: string
          is_system?: boolean
          label: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          id?: string
          is_system?: boolean
          label?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      custom_scripts: {
        Row: {
          active: boolean
          content: string
          created_at: string
          id: string
          name: string
          position: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          content?: string
          created_at?: string
          id?: string
          name?: string
          position?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          content?: string
          created_at?: string
          id?: string
          name?: string
          position?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      custom_themes: {
        Row: {
          created_at: string
          id: string
          name: string
          overrides: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          overrides?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          overrides?: Json
          updated_at?: string
        }
        Relationships: []
      }
      customer_profiles: {
        Row: {
          birthdate: string | null
          cpf_cnpj: string
          created_at: string
          full_name: string
          id: string
          last_login_at: string | null
          marketing_opt_in: boolean
          phone: string | null
          rbx_code: string | null
          rbx_linked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birthdate?: string | null
          cpf_cnpj: string
          created_at?: string
          full_name: string
          id?: string
          last_login_at?: string | null
          marketing_opt_in?: boolean
          phone?: string | null
          rbx_code?: string | null
          rbx_linked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birthdate?: string | null
          cpf_cnpj?: string
          created_at?: string
          full_name?: string
          id?: string
          last_login_at?: string | null
          marketing_opt_in?: boolean
          phone?: string | null
          rbx_code?: string | null
          rbx_linked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      eai_config: {
        Row: {
          active: boolean
          base_url: string
          client_id: string
          client_id_hint: string
          client_secret: string
          company_token: string
          company_token_header: string
          created_at: string
          environment: string
          id: string
          notes: string | null
          oauth_audience: string | null
          oauth_scope: string | null
          oauth_url: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_url?: string
          client_id?: string
          client_id_hint?: string
          client_secret?: string
          company_token?: string
          company_token_header?: string
          created_at?: string
          environment?: string
          id?: string
          notes?: string | null
          oauth_audience?: string | null
          oauth_scope?: string | null
          oauth_url?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_url?: string
          client_id?: string
          client_id_hint?: string
          client_secret?: string
          company_token?: string
          company_token_header?: string
          created_at?: string
          environment?: string
          id?: string
          notes?: string | null
          oauth_audience?: string | null
          oauth_scope?: string | null
          oauth_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      eai_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          method: string
          path: string
          request_body: string | null
          response_body: string | null
          status: number | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          method: string
          path: string
          request_body?: string | null
          response_body?: string | null
          status?: number | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          method?: string
          path?: string
          request_body?: string | null
          response_body?: string | null
          status?: number | null
        }
        Relationships: []
      }
      eai_plans_cache: {
        Row: {
          created_at: string
          eai_plan_id: string
          fetched_at: string
          id: string
          name: string
          price_cents: number | null
          raw: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          eai_plan_id: string
          fetched_at?: string
          id?: string
          name: string
          price_cents?: number | null
          raw?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          eai_plan_id?: string
          fetched_at?: string
          id?: string
          name?: string
          price_cents?: number | null
          raw?: Json
          updated_at?: string
        }
        Relationships: []
      }
      eai_token_cache: {
        Row: {
          access_token: string
          expires_at: string
          id: number
          obtained_at: string
          scope: string | null
          token_type: string
        }
        Insert: {
          access_token: string
          expires_at: string
          id?: number
          obtained_at?: string
          scope?: string | null
          token_type?: string
        }
        Update: {
          access_token?: string
          expires_at?: string
          id?: number
          obtained_at?: string
          scope?: string | null
          token_type?: string
        }
        Relationships: []
      }
      esim_clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      esim_records: {
        Row: {
          client_id: string
          created_at: string
          id: string
          novo_numero: string | null
          numero_atual: string | null
          numero_temporario: string | null
          pdf_url: string | null
          qr_url: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          novo_numero?: string | null
          numero_atual?: string | null
          numero_temporario?: string | null
          pdf_url?: string | null
          qr_url?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          novo_numero?: string | null
          numero_atual?: string | null
          numero_temporario?: string | null
          pdf_url?: string | null
          qr_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "esim_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "esim_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          active: boolean
          answer: string
          created_at: string
          id: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      geofeed_prefixes: {
        Row: {
          active: boolean
          city: string
          country: string
          created_at: string
          id: string
          notes: string
          postal: string
          prefix: string
          region: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          city?: string
          country?: string
          created_at?: string
          id?: string
          notes?: string
          postal?: string
          prefix: string
          region?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          city?: string
          country?: string
          created_at?: string
          id?: string
          notes?: string
          postal?: string
          prefix?: string
          region?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      hero_banners: {
        Row: {
          active: boolean
          alt: string
          created_at: string
          cta_primary: string
          cta_secondary: string
          id: string
          image_mobile_url: string
          image_url: string
          kicker: string
          link_target: string
          link_url: string
          sort_order: number
          title_bottom: string
          title_top: string
          to_primary: string
          to_secondary: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          alt?: string
          created_at?: string
          cta_primary?: string
          cta_secondary?: string
          id?: string
          image_mobile_url?: string
          image_url?: string
          kicker?: string
          link_target?: string
          link_url?: string
          sort_order?: number
          title_bottom?: string
          title_top?: string
          to_primary?: string
          to_secondary?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          alt?: string
          created_at?: string
          cta_primary?: string
          cta_secondary?: string
          id?: string
          image_mobile_url?: string
          image_url?: string
          kicker?: string
          link_target?: string
          link_url?: string
          sort_order?: number
          title_bottom?: string
          title_top?: string
          to_primary?: string
          to_secondary?: string
          updated_at?: string
        }
        Relationships: []
      }
      instagram_settings: {
        Row: {
          access_token: string
          active: boolean
          aspect_ratio: string
          business_account_id: string
          cache_minutes: number
          columns_desktop: number
          columns_mobile: number
          created_at: string
          cta_label: string
          id: string
          layout: string
          post_count: number
          profile_url: string
          show_caption: boolean
          show_type_icon: boolean
          subtitle: string
          title: string
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string
          active?: boolean
          aspect_ratio?: string
          business_account_id?: string
          cache_minutes?: number
          columns_desktop?: number
          columns_mobile?: number
          created_at?: string
          cta_label?: string
          id?: string
          layout?: string
          post_count?: number
          profile_url?: string
          show_caption?: boolean
          show_type_icon?: boolean
          subtitle?: string
          title?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          active?: boolean
          aspect_ratio?: string
          business_account_id?: string
          cache_minutes?: number
          columns_desktop?: number
          columns_mobile?: number
          created_at?: string
          cta_label?: string
          id?: string
          layout?: string
          post_count?: number
          profile_url?: string
          show_caption?: boolean
          show_type_icon?: boolean
          subtitle?: string
          title?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          active: boolean
          category: string
          config: Json
          created_at: string
          id: string
          name: string
          provider: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          config?: Json
          created_at?: string
          id?: string
          name?: string
          provider?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          config?: Json
          created_at?: string
          id?: string
          name?: string
          provider?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          active: boolean
          created_at: string
          department: string
          description: string
          id: string
          location: string
          requirements: string
          sort_order: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          department?: string
          description?: string
          id?: string
          location?: string
          requirements?: string
          sort_order?: number
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          department?: string
          description?: string
          id?: string
          location?: string
          requirements?: string
          sort_order?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      mid_banners: {
        Row: {
          active: boolean
          alt: string
          created_at: string
          id: string
          image_mobile_url: string
          image_url: string
          link_target: string
          link_url: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          alt?: string
          created_at?: string
          id?: string
          image_mobile_url?: string
          image_url?: string
          link_target?: string
          link_url?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          alt?: string
          created_at?: string
          id?: string
          image_mobile_url?: string
          image_url?: string
          link_target?: string
          link_url?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      mp_config: {
        Row: {
          access_token_production: string | null
          access_token_sandbox: string | null
          active: boolean
          binary_mode: boolean
          boleto_due_days: number
          created_at: string
          currency_id: string
          default_capture: boolean
          default_statement_descriptor: string | null
          environment: string
          id: string
          max_installments: number
          pix_expiration_minutes: number
          public_key_production: string | null
          public_key_sandbox: string | null
          site_id: string
          three_d_secure_mode: string
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          access_token_production?: string | null
          access_token_sandbox?: string | null
          active?: boolean
          binary_mode?: boolean
          boleto_due_days?: number
          created_at?: string
          currency_id?: string
          default_capture?: boolean
          default_statement_descriptor?: string | null
          environment?: string
          id?: string
          max_installments?: number
          pix_expiration_minutes?: number
          public_key_production?: string | null
          public_key_sandbox?: string | null
          site_id?: string
          three_d_secure_mode?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          access_token_production?: string | null
          access_token_sandbox?: string | null
          active?: boolean
          binary_mode?: boolean
          boleto_due_days?: number
          created_at?: string
          currency_id?: string
          default_capture?: boolean
          default_statement_descriptor?: string | null
          environment?: string
          id?: string
          max_installments?: number
          pix_expiration_minutes?: number
          public_key_production?: string | null
          public_key_sandbox?: string | null
          site_id?: string
          three_d_secure_mode?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      mp_logs: {
        Row: {
          created_at: string
          direction: string
          duration_ms: number | null
          endpoint: string
          error: string | null
          external_reference: string | null
          id: string
          idempotency_key: string | null
          method: string
          payment_id: string | null
          request_body: Json | null
          request_id: string | null
          response_body: Json | null
          status_code: number | null
        }
        Insert: {
          created_at?: string
          direction?: string
          duration_ms?: number | null
          endpoint: string
          error?: string | null
          external_reference?: string | null
          id?: string
          idempotency_key?: string | null
          method: string
          payment_id?: string | null
          request_body?: Json | null
          request_id?: string | null
          response_body?: Json | null
          status_code?: number | null
        }
        Update: {
          created_at?: string
          direction?: string
          duration_ms?: number | null
          endpoint?: string
          error?: string | null
          external_reference?: string | null
          id?: string
          idempotency_key?: string | null
          method?: string
          payment_id?: string | null
          request_body?: Json | null
          request_id?: string | null
          response_body?: Json | null
          status_code?: number | null
        }
        Relationships: []
      }
      mp_webhooks: {
        Row: {
          action: string | null
          data_id: string | null
          id: string
          live_mode: boolean | null
          process_error: string | null
          processed: boolean
          raw_body: Json | null
          raw_headers: Json | null
          received_at: string
          signature_valid: boolean | null
          topic: string | null
        }
        Insert: {
          action?: string | null
          data_id?: string | null
          id?: string
          live_mode?: boolean | null
          process_error?: string | null
          processed?: boolean
          raw_body?: Json | null
          raw_headers?: Json | null
          received_at?: string
          signature_valid?: boolean | null
          topic?: string | null
        }
        Update: {
          action?: string | null
          data_id?: string | null
          id?: string
          live_mode?: boolean | null
          process_error?: string | null
          processed?: boolean
          raw_body?: Json | null
          raw_headers?: Json | null
          received_at?: string
          signature_valid?: boolean | null
          topic?: string | null
        }
        Relationships: []
      }
      mvno_activations: {
        Row: {
          activation_code: string | null
          checkout_order_id: string | null
          created_at: string
          created_by: string | null
          cycle: number | null
          email_error: string | null
          email_sent_at: string | null
          email_status: string
          iccid: string | null
          id: string
          locale: string | null
          notes: string | null
          product_name: string | null
          product_sku: string | null
          provider: string
          qr_payload: string | null
          raw_response: Json | null
          rbx_cliente_codigo: string | null
          rbx_contrato_codigo: string | null
          rbx_os_codigo: string | null
          rbx_status: string | null
          sim_type: string | null
          source: string
          status: string
          subscriber_doc: string | null
          subscriber_email: string | null
          subscriber_name: string | null
          subscriber_phone: string | null
          tn: string | null
          updated_at: string
        }
        Insert: {
          activation_code?: string | null
          checkout_order_id?: string | null
          created_at?: string
          created_by?: string | null
          cycle?: number | null
          email_error?: string | null
          email_sent_at?: string | null
          email_status?: string
          iccid?: string | null
          id?: string
          locale?: string | null
          notes?: string | null
          product_name?: string | null
          product_sku?: string | null
          provider: string
          qr_payload?: string | null
          raw_response?: Json | null
          rbx_cliente_codigo?: string | null
          rbx_contrato_codigo?: string | null
          rbx_os_codigo?: string | null
          rbx_status?: string | null
          sim_type?: string | null
          source?: string
          status?: string
          subscriber_doc?: string | null
          subscriber_email?: string | null
          subscriber_name?: string | null
          subscriber_phone?: string | null
          tn?: string | null
          updated_at?: string
        }
        Update: {
          activation_code?: string | null
          checkout_order_id?: string | null
          created_at?: string
          created_by?: string | null
          cycle?: number | null
          email_error?: string | null
          email_sent_at?: string | null
          email_status?: string
          iccid?: string | null
          id?: string
          locale?: string | null
          notes?: string | null
          product_name?: string | null
          product_sku?: string | null
          provider?: string
          qr_payload?: string | null
          raw_response?: Json | null
          rbx_cliente_codigo?: string | null
          rbx_contrato_codigo?: string | null
          rbx_os_codigo?: string | null
          rbx_status?: string | null
          sim_type?: string | null
          source?: string
          status?: string
          subscriber_doc?: string | null
          subscriber_email?: string | null
          subscriber_name?: string | null
          subscriber_phone?: string | null
          tn?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mvno_activations_checkout_order_id_fkey"
            columns: ["checkout_order_id"]
            isOneToOne: false
            referencedRelation: "checkout_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      mvno_email_templates: {
        Row: {
          accent_color: string
          footer_html: string
          header_title: string
          id: string
          intro_html: string
          logo_url: string | null
          pdf_footer_text: string
          pdf_header_text: string
          primary_color: string
          signature_html: string
          slug: string
          subject: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accent_color?: string
          footer_html?: string
          header_title?: string
          id?: string
          intro_html?: string
          logo_url?: string | null
          pdf_footer_text?: string
          pdf_header_text?: string
          primary_color?: string
          signature_html?: string
          slug: string
          subject?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accent_color?: string
          footer_html?: string
          header_title?: string
          id?: string
          intro_html?: string
          logo_url?: string | null
          pdf_footer_text?: string
          pdf_header_text?: string
          primary_color?: string
          signature_html?: string
          slug?: string
          subject?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      mvno_rbx_plan_map: {
        Row: {
          active: boolean
          created_at: string
          eai_plan_id: string | null
          eai_plan_name: string | null
          id: string
          last_synced_at: string | null
          notes: string | null
          plan_id: string | null
          product_sku: string | null
          provider: string
          rbx_plan_codigo: string
          rbx_plan_label: string | null
          sim_kind: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          eai_plan_id?: string | null
          eai_plan_name?: string | null
          id?: string
          last_synced_at?: string | null
          notes?: string | null
          plan_id?: string | null
          product_sku?: string | null
          provider: string
          rbx_plan_codigo: string
          rbx_plan_label?: string | null
          sim_kind?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          eai_plan_id?: string | null
          eai_plan_name?: string | null
          id?: string
          last_synced_at?: string | null
          notes?: string | null
          plan_id?: string | null
          product_sku?: string | null
          provider?: string
          rbx_plan_codigo?: string
          rbx_plan_label?: string | null
          sim_kind?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mvno_rbx_plan_map_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      page_top_banners: {
        Row: {
          active: boolean
          alt: string
          created_at: string
          height_px: number
          id: string
          image_mobile_url: string
          image_url: string
          link_url: string
          overlay_align_h: string
          overlay_align_v: string
          overlay_color: string
          overlay_color2: string
          overlay_cta_bg: string
          overlay_cta_color: string
          overlay_cta_size: string
          overlay_cta_text: string
          overlay_cta_url: string
          overlay_cta_variant: string
          overlay_enabled: boolean
          overlay_gradient_dir: string
          overlay_opacity: number
          overlay_subtitle: string
          overlay_text: string
          overlay_text_color: string
          overlay_type: string
          path: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          alt?: string
          created_at?: string
          height_px?: number
          id?: string
          image_mobile_url?: string
          image_url?: string
          link_url?: string
          overlay_align_h?: string
          overlay_align_v?: string
          overlay_color?: string
          overlay_color2?: string
          overlay_cta_bg?: string
          overlay_cta_color?: string
          overlay_cta_size?: string
          overlay_cta_text?: string
          overlay_cta_url?: string
          overlay_cta_variant?: string
          overlay_enabled?: boolean
          overlay_gradient_dir?: string
          overlay_opacity?: number
          overlay_subtitle?: string
          overlay_text?: string
          overlay_text_color?: string
          overlay_type?: string
          path?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          alt?: string
          created_at?: string
          height_px?: number
          id?: string
          image_mobile_url?: string
          image_url?: string
          link_url?: string
          overlay_align_h?: string
          overlay_align_v?: string
          overlay_color?: string
          overlay_color2?: string
          overlay_cta_bg?: string
          overlay_cta_color?: string
          overlay_cta_size?: string
          overlay_cta_text?: string
          overlay_cta_url?: string
          overlay_cta_variant?: string
          overlay_enabled?: boolean
          overlay_gradient_dir?: string
          overlay_opacity?: number
          overlay_subtitle?: string
          overlay_text?: string
          overlay_text_color?: string
          overlay_type?: string
          path?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          duration_ms: number
          id: string
          page_path: string
          referrer: string
          session_id: string
          user_agent: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number
          id?: string
          page_path?: string
          referrer?: string
          session_id?: string
          user_agent?: string
        }
        Update: {
          created_at?: string
          duration_ms?: number
          id?: string
          page_path?: string
          referrer?: string
          session_id?: string
          user_agent?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          active: boolean
          created_at: string
          id: string
          meta_description: string
          meta_title: string
          og_image: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          meta_description?: string
          meta_title?: string
          og_image?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          meta_description?: string
          meta_title?: string
          og_image?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_routing: {
        Row: {
          enabled: boolean
          fallback_order: string[]
          method: string
          primary_provider: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          fallback_order?: string[]
          method: string
          primary_provider?: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          fallback_order?: string[]
          method?: string
          primary_provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          accent_color: string
          accent_label: string
          active: boolean
          badges: Json
          category: string
          chip_type: string
          combo_discount_percent: number
          combo_highlight_text: string
          combo_price_cents: number
          conditions: string
          created_at: string
          description: string
          icon: string
          id: string
          includes: Json
          logo_url: string
          name: string
          original_price_cents: number
          portability_gb: number
          portability_label: string
          price_cents: number
          promo_months: number
          rbx_plan_codigo: string | null
          sort_order: number
          sva_ids: Json
          type: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          accent_label?: string
          active?: boolean
          badges?: Json
          category: string
          chip_type?: string
          combo_discount_percent?: number
          combo_highlight_text?: string
          combo_price_cents?: number
          conditions?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          includes?: Json
          logo_url?: string
          name: string
          original_price_cents?: number
          portability_gb?: number
          portability_label?: string
          price_cents: number
          promo_months?: number
          rbx_plan_codigo?: string | null
          sort_order?: number
          sva_ids?: Json
          type?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          accent_label?: string
          active?: boolean
          badges?: Json
          category?: string
          chip_type?: string
          combo_discount_percent?: number
          combo_highlight_text?: string
          combo_price_cents?: number
          conditions?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          includes?: Json
          logo_url?: string
          name?: string
          original_price_cents?: number
          portability_gb?: number
          portability_label?: string
          price_cents?: number
          promo_months?: number
          rbx_plan_codigo?: string | null
          sort_order?: number
          sva_ids?: Json
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      popup_stats: {
        Row: {
          created_at: string
          event_type: string
          id: string
          page_path: string
          popup_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: string
          page_path?: string
          popup_id: string
          session_id?: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          page_path?: string
          popup_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "popup_stats_popup_id_fkey"
            columns: ["popup_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          last_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_banners: {
        Row: {
          active: boolean
          alt: string
          bg_gradient: string
          created_at: string
          highlight: string
          id: string
          image_mobile_url: string
          image_url: string
          link_target: string
          link_url: string
          sort_order: number
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          alt?: string
          bg_gradient?: string
          created_at?: string
          highlight?: string
          id?: string
          image_mobile_url?: string
          image_url?: string
          link_target?: string
          link_url?: string
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          alt?: string
          bg_gradient?: string
          created_at?: string
          highlight?: string
          id?: string
          image_mobile_url?: string
          image_url?: string
          link_target?: string
          link_url?: string
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      provisioning_jobs: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          next_run_at: string
          order_id: string
          status: Database["public"]["Enums"]["provisioning_job_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          next_run_at?: string
          order_id: string
          status?: Database["public"]["Enums"]["provisioning_job_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          next_run_at?: string
          order_id?: string
          status?: Database["public"]["Enums"]["provisioning_job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provisioning_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "checkout_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      rbx_config: {
        Row: {
          active: boolean
          auth_key_v1: string
          auth_key_v2: string
          base_url: string
          created_at: string
          environment: string
          id: string
          last_test_at: string | null
          last_test_status: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          auth_key_v1?: string
          auth_key_v2?: string
          base_url?: string
          created_at?: string
          environment?: string
          id?: string
          last_test_at?: string | null
          last_test_status?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          auth_key_v1?: string
          auth_key_v2?: string
          base_url?: string
          created_at?: string
          environment?: string
          id?: string
          last_test_at?: string | null
          last_test_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      rbx_offline_snapshots: {
        Row: {
          by_nas: Json
          by_olt: Json
          by_region: Json
          captured_at: string
          id: string
          total: number
        }
        Insert: {
          by_nas?: Json
          by_olt?: Json
          by_region?: Json
          captured_at?: string
          id?: string
          total?: number
        }
        Update: {
          by_nas?: Json
          by_olt?: Json
          by_region?: Json
          captured_at?: string
          id?: string
          total?: number
        }
        Relationships: []
      }
      rbx_plans_cache: {
        Row: {
          codigo: string
          created_at: string
          descricao: string
          fetched_at: string
          id: string
          kind: string | null
          raw: Json
          updated_at: string
          valor_cents: number | null
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao: string
          fetched_at?: string
          id?: string
          kind?: string | null
          raw?: Json
          updated_at?: string
          valor_cents?: number | null
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string
          fetched_at?: string
          id?: string
          kind?: string | null
          raw?: Json
          updated_at?: string
          valor_cents?: number | null
        }
        Relationships: []
      }
      rbx_service_permissions: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          last_test_at: string | null
          last_test_error: string | null
          last_test_latency_ms: number | null
          last_test_status: string | null
          service_label: string
          service_slug: string
          service_type: string
          sort_order: number
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          last_test_at?: string | null
          last_test_error?: string | null
          last_test_latency_ms?: number | null
          last_test_status?: string | null
          service_label?: string
          service_slug: string
          service_type?: string
          sort_order?: number
          updated_at?: string
          version: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          last_test_at?: string | null
          last_test_error?: string | null
          last_test_latency_ms?: number | null
          last_test_status?: string | null
          service_label?: string
          service_slug?: string
          service_type?: string
          sort_order?: number
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          message: string
          notes: string
          referred_city: string
          referred_name: string
          referred_phone: string
          referrer_city: string
          referrer_email: string
          referrer_name: string
          referrer_phone: string
          reward_status: string
          reward_value_cents: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          notes?: string
          referred_city?: string
          referred_name: string
          referred_phone: string
          referrer_city?: string
          referrer_email?: string
          referrer_name: string
          referrer_phone: string
          reward_status?: string
          reward_value_cents?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          notes?: string
          referred_city?: string
          referred_name?: string
          referred_phone?: string
          referrer_city?: string
          referrer_email?: string
          referrer_name?: string
          referrer_phone?: string
          reward_status?: string
          reward_value_cents?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          available_to_travel: boolean
          city: string
          created_at: string
          email: string
          file_name: string
          file_path: string
          id: string
          message: string
          name: string
          notes: string
          phone: string
          position: string
          status: string
          updated_at: string
        }
        Insert: {
          available_to_travel?: boolean
          city?: string
          created_at?: string
          email?: string
          file_name?: string
          file_path?: string
          id?: string
          message?: string
          name: string
          notes?: string
          phone?: string
          position?: string
          status?: string
          updated_at?: string
        }
        Update: {
          available_to_travel?: boolean
          city?: string
          created_at?: string
          email?: string
          file_name?: string
          file_path?: string
          id?: string
          message?: string
          name?: string
          notes?: string
          phone?: string
          position?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          role_slug: string | null
          section: string
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          role_slug?: string | null
          section: string
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_slug?: string | null
          section?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      sitemap_pages: {
        Row: {
          active: boolean
          changefreq: string
          created_at: string
          id: string
          path: string
          priority: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          changefreq?: string
          created_at?: string
          id?: string
          path: string
          priority?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          changefreq?: string
          created_at?: string
          id?: string
          path?: string
          priority?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          active: boolean
          created_at: string
          date_label: string
          id: string
          name: string
          photo_url: string
          rating: number
          sort_order: number
          text: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          date_label?: string
          id?: string
          name: string
          photo_url?: string
          rating?: number
          sort_order?: number
          text?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          date_label?: string
          id?: string
          name?: string
          photo_url?: string
          rating?: number
          sort_order?: number
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      theme_schedules: {
        Row: {
          active: boolean
          created_at: string
          ends_at: string
          id: string
          starts_at: string
          theme_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          ends_at: string
          id?: string
          starts_at: string
          theme_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          ends_at?: string
          id?: string
          starts_at?: string
          theme_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          role_slug: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          role_slug?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_slug?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempts: number
          created_at: string
          duration_ms: number | null
          endpoint_id: string
          event: string
          id: string
          last_error: string | null
          last_response: string | null
          last_status_code: number | null
          next_attempt_at: string
          payload: Json
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          duration_ms?: number | null
          endpoint_id: string
          event: string
          id?: string
          last_error?: string | null
          last_response?: string | null
          last_status_code?: number | null
          next_attempt_at?: string
          payload: Json
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          duration_ms?: number | null
          endpoint_id?: string
          event?: string
          id?: string
          last_error?: string | null
          last_response?: string | null
          last_status_code?: number | null
          next_attempt_at?: string
          payload?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          description: string | null
          events: string[]
          headers: Json
          id: string
          max_retries: number
          name: string
          secret: string
          timeout_ms: number
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          events?: string[]
          headers?: Json
          id?: string
          max_retries?: number
          name: string
          secret: string
          timeout_ms?: number
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          events?: string[]
          headers?: Json
          id?: string
          max_retries?: number
          name?: string
          secret?: string
          timeout_ms?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      webmail_accounts: {
        Row: {
          created_at: string
          display_name: string
          email: string
          encrypted_password: string
          id: string
          imap_host: string
          imap_port: number
          imap_secure: boolean
          last_login_at: string | null
          signature_html: string
          smtp_host: string
          smtp_port: number
          smtp_secure: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          email: string
          encrypted_password: string
          id?: string
          imap_host: string
          imap_port?: number
          imap_secure?: boolean
          last_login_at?: string | null
          signature_html?: string
          smtp_host: string
          smtp_port?: number
          smtp_secure?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          encrypted_password?: string
          id?: string
          imap_host?: string
          imap_port?: number
          imap_secure?: boolean
          last_login_at?: string | null
          signature_html?: string
          smtp_host?: string
          smtp_port?: number
          smtp_secure?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      webmail_contact_categories: {
        Row: {
          account_id: string
          color: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          account_id: string
          color?: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      webmail_contact_label_links: {
        Row: {
          contact_id: string
          created_at: string
          label_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          label_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          label_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webmail_contact_label_links_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "webmail_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webmail_contact_label_links_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "webmail_contact_labels"
            referencedColumns: ["id"]
          },
        ]
      }
      webmail_contact_labels: {
        Row: {
          account_id: string
          color: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          account_id: string
          color?: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      webmail_contacts: {
        Row: {
          account_id: string
          category: string
          company: string
          created_at: string
          email: string
          favorite: boolean
          id: string
          last_interaction_at: string | null
          name: string
          notes: string
          phone: string
          updated_at: string
        }
        Insert: {
          account_id: string
          category?: string
          company?: string
          created_at?: string
          email?: string
          favorite?: boolean
          id?: string
          last_interaction_at?: string | null
          name?: string
          notes?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          category?: string
          company?: string
          created_at?: string
          email?: string
          favorite?: boolean
          id?: string
          last_interaction_at?: string | null
          name?: string
          notes?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      webmail_drafts: {
        Row: {
          account_id: string
          attachments: Json
          bcc: Json
          body_html: string
          cc: Json
          created_at: string
          id: string
          in_reply_to: string
          subject: string
          to: Json
          updated_at: string
        }
        Insert: {
          account_id: string
          attachments?: Json
          bcc?: Json
          body_html?: string
          cc?: Json
          created_at?: string
          id?: string
          in_reply_to?: string
          subject?: string
          to?: Json
          updated_at?: string
        }
        Update: {
          account_id?: string
          attachments?: Json
          bcc?: Json
          body_html?: string
          cc?: Json
          created_at?: string
          id?: string
          in_reply_to?: string
          subject?: string
          to?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webmail_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "webmail_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      webmail_message_cache: {
        Row: {
          account_id: string
          cached_at: string
          cc: Json
          date: string | null
          flags: Json
          folder: string
          from: Json
          has_attachments: boolean
          id: string
          in_reply_to: string
          message_id: string
          size_bytes: number
          snippet: string
          subject: string
          thread_id: string
          to: Json
          uid: number
        }
        Insert: {
          account_id: string
          cached_at?: string
          cc?: Json
          date?: string | null
          flags?: Json
          folder: string
          from?: Json
          has_attachments?: boolean
          id?: string
          in_reply_to?: string
          message_id?: string
          size_bytes?: number
          snippet?: string
          subject?: string
          thread_id?: string
          to?: Json
          uid: number
        }
        Update: {
          account_id?: string
          cached_at?: string
          cc?: Json
          date?: string | null
          flags?: Json
          folder?: string
          from?: Json
          has_attachments?: boolean
          id?: string
          in_reply_to?: string
          message_id?: string
          size_bytes?: number
          snippet?: string
          subject?: string
          thread_id?: string
          to?: Json
          uid?: number
        }
        Relationships: [
          {
            foreignKeyName: "webmail_message_cache_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "webmail_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      webmail_sessions: {
        Row: {
          account_id: string
          created_at: string
          expires_at: string
          id: string
          ip: string
          last_used_at: string
          token_hash: string
          user_agent: string
        }
        Insert: {
          account_id: string
          created_at?: string
          expires_at: string
          id?: string
          ip?: string
          last_used_at?: string
          token_hash: string
          user_agent?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip?: string
          last_used_at?: string
          token_hash?: string
          user_agent?: string
        }
        Relationships: [
          {
            foreignKeyName: "webmail_sessions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "webmail_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      webmail_signatures: {
        Row: {
          account_email: string
          created_at: string
          enabled: boolean
          html: string
          id: string
          updated_at: string
        }
        Insert: {
          account_email: string
          created_at?: string
          enabled?: boolean
          html?: string
          id?: string
          updated_at?: string
        }
        Update: {
          account_email?: string
          created_at?: string
          enabled?: boolean
          html?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      instagram_settings_public: {
        Row: {
          active: boolean | null
          aspect_ratio: string | null
          cache_minutes: number | null
          columns_desktop: number | null
          columns_mobile: number | null
          cta_label: string | null
          id: string | null
          layout: string | null
          post_count: number | null
          profile_url: string | null
          show_caption: boolean | null
          show_type_icon: boolean | null
          subtitle: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          aspect_ratio?: string | null
          cache_minutes?: number | null
          columns_desktop?: number | null
          columns_mobile?: number | null
          cta_label?: string | null
          id?: string | null
          layout?: string | null
          post_count?: number | null
          profile_url?: string | null
          show_caption?: boolean | null
          show_type_icon?: boolean | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          aspect_ratio?: string | null
          cache_minutes?: number | null
          columns_desktop?: number | null
          columns_mobile?: number | null
          cta_label?: string | null
          id?: string | null
          layout?: string | null
          post_count?: number | null
          profile_url?: string | null
          show_caption?: boolean | null
          show_type_icon?: boolean | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      claim_orders_for_customer: { Args: { _user_id: string }; Returns: number }
      count_users_by_role_slug: { Args: { _slug: string }; Returns: number }
      emit_webhook_event: {
        Args: { _data: Json; _event: string }
        Returns: number
      }
      enqueue_provisioning: { Args: { _order_id: string }; Returns: string }
      get_active_coupon_for: {
        Args: { _placement: string }
        Returns: {
          code: string
          discount_cents: number
          label: string
        }[]
      }
      get_admin_users: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          role: string
          role_slug: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_section_permission: {
        Args: { _section: string; _user_id: string }
        Returns: boolean
      }
      mark_order_paid: {
        Args: { _cielo_status?: number; _order_id: string; _payload?: Json }
        Returns: boolean
      }
      set_user_role: {
        Args: {
          _new_role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: undefined
      }
      set_user_role_slug: {
        Args: { _new_slug: string; _target_user_id: string }
        Returns: undefined
      }
      validate_coupon: {
        Args: { _code: string; _subtotal_cents?: number }
        Returns: {
          code: string
          discount_cents: number
          label: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "moderator"
      checkout_status:
        | "pending"
        | "authorized"
        | "paid"
        | "failed"
        | "canceled"
        | "refunded"
        | "expired"
      provisioning_job_status:
        | "pending"
        | "running"
        | "done"
        | "failed"
        | "dead_letter"
      provisioning_status:
        | "not_started"
        | "queued"
        | "running"
        | "provisioned"
        | "failed"
        | "manual_review"
        | "awaiting_shipment"
      sim_kind: "esim" | "physical"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "moderator"],
      checkout_status: [
        "pending",
        "authorized",
        "paid",
        "failed",
        "canceled",
        "refunded",
        "expired",
      ],
      provisioning_job_status: [
        "pending",
        "running",
        "done",
        "failed",
        "dead_letter",
      ],
      provisioning_status: [
        "not_started",
        "queued",
        "running",
        "provisioned",
        "failed",
        "manual_review",
        "awaiting_shipment",
      ],
      sim_kind: ["esim", "physical"],
    },
  },
} as const
