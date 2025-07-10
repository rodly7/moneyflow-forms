import { supabase } from "@/integrations/supabase/client";

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  notification_type: string;
  target_role?: string | null;
  target_country?: string | null;
  target_users?: string[] | null;
  total_recipients: number;
  created_at: string;
  sent_by?: string | null;
}

export interface NotificationResult {
  success: boolean;
  message: string;
  data?: any;
}

export class NotificationService {
  
  // Créer une notification avec gestion d'erreurs robuste
  static async createNotification(
    title: string,
    message: string,
    priority: 'low' | 'normal' | 'high',
    notificationType: 'all' | 'role' | 'country' | 'individual',
    targetUsers: Array<{id: string}>,
    selectedRole?: string,
    selectedCountry?: string,
    selectedUserIds?: string[],
    sentBy?: string
  ): Promise<NotificationResult> {
    try {
      // Créer la notification principale
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          title,
          message,
          priority,
          notification_type: notificationType,
          target_role: selectedRole || null,
          target_country: selectedCountry || null,
          target_users: notificationType === 'individual' ? selectedUserIds : null,
          sent_by: sentBy,
          total_recipients: targetUsers.length
        })
        .select()
        .single();

      if (notificationError) {
        throw new Error(`Erreur lors de la création de la notification: ${notificationError.message}`);
      }

      // Créer les entrées pour chaque destinataire
      const recipients = targetUsers.map(user => ({
        notification_id: notification.id,
        user_id: user.id,
        status: 'sent'
      }));

      const { error: recipientError } = await supabase
        .from('notification_recipients')
        .insert(recipients);

      if (recipientError) {
        throw new Error(`Erreur lors de l'ajout des destinataires: ${recipientError.message}`);
      }

      return {
        success: true,
        message: `Notification envoyée à ${targetUsers.length} utilisateur(s)`,
        data: notification
      };

    } catch (error: any) {
      console.error('Erreur dans createNotification:', error);
      return {
        success: false,
        message: error.message || "Erreur lors de l'envoi de la notification"
      };
    }
  }

  // Récupérer toutes les notifications avec pagination
  static async getNotifications(
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationResult> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Erreur lors de la récupération des notifications: ${error.message}`);
      }

      return {
        success: true,
        message: "Notifications récupérées avec succès",
        data: data || []
      };

    } catch (error: any) {
      console.error('Erreur dans getNotifications:', error);
      return {
        success: false,
        message: error.message || "Erreur lors de la récupération des notifications"
      };
    }
  }

  // Récupérer les notifications récentes (pour le tableau de bord)
  static async getRecentNotifications(limit: number = 10): Promise<NotificationResult> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Erreur lors de la récupération des notifications récentes: ${error.message}`);
      }

      return {
        success: true,
        message: "Notifications récentes récupérées avec succès",
        data: data || []
      };

    } catch (error: any) {
      console.error('Erreur dans getRecentNotifications:', error);
      return {
        success: false,
        message: error.message || "Erreur lors de la récupération des notifications récentes"
      };
    }
  }

  // Récupérer tous les utilisateurs pour les notifications
  static async getUsersForNotifications(): Promise<NotificationResult> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role, country')
        .order('full_name');

      if (error) {
        throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
      }

      return {
        success: true,
        message: "Utilisateurs récupérés avec succès",
        data: data || []
      };

    } catch (error: any) {
      console.error('Erreur dans getUsersForNotifications:', error);
      return {
        success: false,
        message: error.message || "Erreur lors de la récupération des utilisateurs"
      };
    }
  }

  // Récupérer la liste des pays uniques
  static async getCountriesList(): Promise<NotificationResult> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('country')
        .not('country', 'is', null);

      if (error) {
        throw new Error(`Erreur lors de la récupération des pays: ${error.message}`);
      }

      const uniqueCountries = [...new Set(data?.map(item => item.country))].filter(Boolean);

      return {
        success: true,
        message: "Pays récupérés avec succès",
        data: uniqueCountries
      };

    } catch (error: any) {
      console.error('Erreur dans getCountriesList:', error);
      return {
        success: false,
        message: error.message || "Erreur lors de la récupération des pays"
      };
    }
  }

  // Créer une notification automatique (pour les dépôts d'agents, etc.)
  static async createAutoNotification(
    title: string,
    message: string,
    priority: 'low' | 'normal' | 'high' = 'normal',
    targetUserIds: string[],
    sentBy?: string
  ): Promise<NotificationResult> {
    try {
      return await this.createNotification(
        title,
        message,
        priority,
        'individual',
        targetUserIds.map(id => ({ id })),
        undefined,
        undefined,
        targetUserIds,
        sentBy
      );

    } catch (error: any) {
      console.error('Erreur dans createAutoNotification:', error);
      return {
        success: false,
        message: error.message || "Erreur lors de la création de la notification automatique"
      };
    }
  }
}