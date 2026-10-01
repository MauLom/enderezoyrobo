
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "card_printing": {
                  Row: {
                    "collector_number": string,"id": string,"image_uri": string | null,"lang": string,"name": string,"oracle_id": string,"rarity": string,"released_at": string | null,"set_code": string,"set_name": string,"updated_at": string
                  }
                  Insert: {
                    "collector_number": string,"id": string,"image_uri"?: string | null,"lang"?: string,"name": string,"oracle_id": string,"rarity": string,"released_at"?: string | null,"set_code": string,"set_name": string,"updated_at"?: string
                  }
                  Update: {
                    "collector_number"?: string,"id"?: string,"image_uri"?: string | null,"lang"?: string,"name"?: string,"oracle_id"?: string,"rarity"?: string,"released_at"?: string | null,"set_code"?: string,"set_name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"contact": {
                  Row: {
                    "profile_id": string,"updated_at": string,"whatsapp": string
                  }
                  Insert: {
                    "profile_id": string,"updated_at"?: string,"whatsapp": string
                  }
                  Update: {
                    "profile_id"?: string,"updated_at"?: string,"whatsapp"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "contact_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: true
      referencedRelation: "profile"
      referencedColumns: ["id"]
    }
                  ]
                },"exchange_rate": {
                  Row: {
                    "as_of": string,"currency": string,"mxn_per_unit": number
                  }
                  Insert: {
                    "as_of": string,"currency": string,"mxn_per_unit": number
                  }
                  Update: {
                    "as_of"?: string,"currency"?: string,"mxn_per_unit"?: number
                  }
                  Relationships: [
                    
                  ]
                },"inventory_item": {
                  Row: {
                    "condition": Database["public"]['Enums']["card_condition"],"foil": boolean,"id": string,"language": string,"price_mxn_cents": number,"printing_id": string,"quantity": number,"seller_id": string,"updated_at": string
                  }
                  Insert: {
                    "condition": Database["public"]['Enums']["card_condition"],"foil"?: boolean,"id"?: string,"language"?: string,"price_mxn_cents": number,"printing_id": string,"quantity": number,"seller_id": string,"updated_at"?: string
                  }
                  Update: {
                    "condition"?: Database["public"]['Enums']["card_condition"],"foil"?: boolean,"id"?: string,"language"?: string,"price_mxn_cents"?: number,"printing_id"?: string,"quantity"?: number,"seller_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventory_item_printing_id_fkey"
      columns: ["printing_id"]
isOneToOne: false
      referencedRelation: "card_printing"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_item_seller_id_fkey"
      columns: ["seller_id"]
isOneToOne: false
      referencedRelation: "profile"
      referencedColumns: ["id"]
    }
                  ]
                },"offer": {
                  Row: {
                    "created_at": string,"id": string,"message": string | null,"responded_at": string | null,"seller_id": string,"status": Database["public"]['Enums']["offer_status"],"total_mxn_cents": number,"want_list_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"message"?: string | null,"responded_at"?: string | null,"seller_id": string,"status"?: Database["public"]['Enums']["offer_status"],"total_mxn_cents": number,"want_list_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"message"?: string | null,"responded_at"?: string | null,"seller_id"?: string,"status"?: Database["public"]['Enums']["offer_status"],"total_mxn_cents"?: number,"want_list_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "offer_seller_id_fkey"
      columns: ["seller_id"]
isOneToOne: false
      referencedRelation: "profile"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "offer_want_list_id_fkey"
      columns: ["want_list_id"]
isOneToOne: false
      referencedRelation: "want_list"
      referencedColumns: ["id"]
    }
                  ]
                },"offer_item": {
                  Row: {
                    "offer_id": string,"quantity": number,"want_list_item_id": string
                  }
                  Insert: {
                    "offer_id": string,"quantity": number,"want_list_item_id": string
                  }
                  Update: {
                    "offer_id"?: string,"quantity"?: number,"want_list_item_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "offer_item_offer_id_fkey"
      columns: ["offer_id"]
isOneToOne: false
      referencedRelation: "offer"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "offer_item_want_list_item_id_fkey"
      columns: ["want_list_item_id"]
isOneToOne: false
      referencedRelation: "want_list_item"
      referencedColumns: ["id"]
    }
                  ]
                },"price_reference": {
                  Row: {
                    "amount": number,"as_of": string,"currency": string,"finish": Database["public"]['Enums']["card_finish"],"printing_id": string,"source": Database["public"]['Enums']["price_source"]
                  }
                  Insert: {
                    "amount": number,"as_of": string,"currency": string,"finish": Database["public"]['Enums']["card_finish"],"printing_id": string,"source": Database["public"]['Enums']["price_source"]
                  }
                  Update: {
                    "amount"?: number,"as_of"?: string,"currency"?: string,"finish"?: Database["public"]['Enums']["card_finish"],"printing_id"?: string,"source"?: Database["public"]['Enums']["price_source"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "price_reference_printing_id_fkey"
      columns: ["printing_id"]
isOneToOne: false
      referencedRelation: "card_printing"
      referencedColumns: ["id"]
    }
                  ]
                },"profile": {
                  Row: {
                    "created_at": string,"display_name": string,"id": string,"kind": Database["public"]['Enums']["profile_kind"],"oportunidades_vistas_at": string | null,"plan": string,"verified": boolean
                  }
                  Insert: {
                    "created_at"?: string,"display_name": string,"id": string,"kind"?: Database["public"]['Enums']["profile_kind"],"oportunidades_vistas_at"?: string | null,"plan"?: string,"verified"?: boolean
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["profile_kind"],"oportunidades_vistas_at"?: string | null,"plan"?: string,"verified"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"rating": {
                  Row: {
                    "comment": string | null,"created_at": string,"from_id": string,"id": string,"offer_id": string,"score": number,"to_id": string
                  }
                  Insert: {
                    "comment"?: string | null,"created_at"?: string,"from_id": string,"id"?: string,"offer_id": string,"score": number,"to_id": string
                  }
                  Update: {
                    "comment"?: string | null,"created_at"?: string,"from_id"?: string,"id"?: string,"offer_id"?: string,"score"?: number,"to_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rating_from_id_fkey"
      columns: ["from_id"]
isOneToOne: false
      referencedRelation: "profile"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rating_offer_id_fkey"
      columns: ["offer_id"]
isOneToOne: false
      referencedRelation: "offer"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rating_to_id_fkey"
      columns: ["to_id"]
isOneToOne: false
      referencedRelation: "profile"
      referencedColumns: ["id"]
    }
                  ]
                },"store": {
                  Row: {
                    "address": string | null,"created_at": string,"id": string,"inventory_updated_at": string | null,"name": string,"price_reference_note": string | null,"profile_id": string,"verified_at": string | null,"whatsapp": string | null
                  }
                  Insert: {
                    "address"?: string | null,"created_at"?: string,"id"?: string,"inventory_updated_at"?: string | null,"name": string,"price_reference_note"?: string | null,"profile_id": string,"verified_at"?: string | null,"whatsapp"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"created_at"?: string,"id"?: string,"inventory_updated_at"?: string | null,"name"?: string,"price_reference_note"?: string | null,"profile_id"?: string,"verified_at"?: string | null,"whatsapp"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "store_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: true
      referencedRelation: "profile"
      referencedColumns: ["id"]
    }
                  ]
                },"want_list": {
                  Row: {
                    "created_at": string,"id": string,"is_public": boolean,"name": string,"owner_id": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_public"?: boolean,"name": string,"owner_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_public"?: boolean,"name"?: string,"owner_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "want_list_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profile"
      referencedColumns: ["id"]
    }
                  ]
                },"want_list_item": {
                  Row: {
                    "foil": Database["public"]['Enums']["foil_preference"],"id": string,"language": string | null,"min_condition": Database["public"]['Enums']["card_condition"],"oracle_id": string,"printing_id": string | null,"quantity": number,"want_list_id": string
                  }
                  Insert: {
                    "foil"?: Database["public"]['Enums']["foil_preference"],"id"?: string,"language"?: string | null,"min_condition"?: Database["public"]['Enums']["card_condition"],"oracle_id": string,"printing_id"?: string | null,"quantity": number,"want_list_id": string
                  }
                  Update: {
                    "foil"?: Database["public"]['Enums']["foil_preference"],"id"?: string,"language"?: string | null,"min_condition"?: Database["public"]['Enums']["card_condition"],"oracle_id"?: string,"printing_id"?: string | null,"quantity"?: number,"want_list_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "want_list_item_printing_id_fkey"
      columns: ["printing_id"]
isOneToOne: false
      referencedRelation: "card_printing"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "want_list_item_want_list_id_fkey"
      columns: ["want_list_id"]
isOneToOne: false
      referencedRelation: "want_list"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "avisos_vendedor":
{ Args: Record<PropertyKey, never>; Returns: {
              "listas_nuevas": number,"respuestas": number
            }[]
                           },
"buscar_impresiones":
{ Args: { "nombres": (string)[] }; Returns: {
              "collector_number": string,"id": string,"image_uri": string,"lang": string,"name": string,"oracle_id": string,"released_at": string,"set_code": string,"set_name": string
            }[]
                           },
"crear_oferta":
{ Args: { "items": Json,"lista": string,"mensaje": string,"total": number }; Returns: string
                           },
"inventario_cumple":
{ Args: { "i": Database["public"]['Tables']["inventory_item"]['Row'],"i_oracle_id": string,"w": Database["public"]['Tables']["want_list_item"]['Row'] }; Returns: boolean
                           },
"inventario_para":
{ Args: { "oracle_ids": (string)[] }; Returns: {
              "card_name": string,"collector_number": string,"condition": Database["public"]['Enums']["card_condition"],"foil": boolean,"id": string,"inventory_updated_at": string,"language": string,"oracle_id": string,"price_mxn_cents": number,"printing_id": string,"quantity": number,"seller_id": string,"seller_kind": Database["public"]['Enums']["profile_kind"],"seller_name": string,"set_code": string,"store_name": string,"store_verified": boolean,"store_whatsapp": string
            }[]
                           },
"mi_inventario_para":
{ Args: { "oracle_ids": (string)[] }; Returns: {
              "card_name": string,"collector_number": string,"condition": Database["public"]['Enums']["card_condition"],"foil": boolean,"id": string,"inventory_updated_at": string,"language": string,"oracle_id": string,"price_mxn_cents": number,"printing_id": string,"quantity": number,"seller_id": string,"seller_kind": Database["public"]['Enums']["profile_kind"],"seller_name": string,"set_code": string,"store_name": string,"store_verified": boolean,"store_whatsapp": string
            }[]
                           },
"oportunidades":
{ Args: Record<PropertyKey, never>; Returns: {
              "foil": Database["public"]['Enums']["foil_preference"],"item_id": string,"language": string,"list_name": string,"list_updated_at": string,"min_condition": Database["public"]['Enums']["card_condition"],"oracle_id": string,"owner_name": string,"printing_id": string,"quantity": number,"want_list_id": string
            }[]
                           },
"resumen_cartas":
{ Args: { "oracle_ids": (string)[] }; Returns: {
              "eur_min": number,"image_uri": string,"name": string,"oracle_id": string,"set_code": string,"usd_min": number
            }[]
                           },
"show_limit":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"show_trgm":
{ Args: { "": string }; Returns: (string)[]
                           },
"whatsapp_de_mis_tratos":
{ Args: Record<PropertyKey, never>; Returns: {
              "profile_id": string,"whatsapp": string
            }[]
                           },
"whatsapp_de_oferta":
{ Args: { "p_offer_id": string }; Returns: string
                           }
          }
          Enums: {
            "card_condition": "NM"|"LP"|"MP"|"HP"|"DMG","card_finish": "nonfoil"|"foil"|"etched","foil_preference": "yes"|"no"|"any","offer_status": "pending"|"accepted"|"rejected"|"withdrawn","price_source": "ck"|"tcgplayer"|"cardmarket","profile_kind": "player"|"seller"|"store"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "card_condition": ["NM", "LP", "MP", "HP", "DMG"],"card_finish": ["nonfoil", "foil", "etched"],"foil_preference": ["yes", "no", "any"],"offer_status": ["pending", "accepted", "rejected", "withdrawn"],"price_source": ["ck", "tcgplayer", "cardmarket"],"profile_kind": ["player", "seller", "store"]
          }
        }
} as const

