// src/hooks/useNotifications.ts
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotifications() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        // Did not get permission
        return;
      }
      // Note: In a real app we would get the Expo push token here and send it to the NestJS backend
      // token = (await Notifications.getExpoPushTokenAsync()).data;
    }
  }

  const scheduleRestTimerNotification = async (seconds: number) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Rest complete! 🏋️",
        body: "Time for your next set. Let's get it!",
        sound: true,
      },
      trigger: {
         seconds: seconds,
         type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL
      },
    });
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  return {
    scheduleRestTimerNotification,
    cancelAllNotifications,
  };
}
