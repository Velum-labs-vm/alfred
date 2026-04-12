import {Alert, Linking, PermissionsAndroid, Platform} from 'react-native';

export const REQUIRED_PERMISSIONS = [
  PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  PermissionsAndroid.PERMISSIONS.READ_CALENDAR,
  PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR,
  PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
  PermissionsAndroid.PERMISSIONS.READ_SMS,
  PermissionsAndroid.PERMISSIONS.SEND_SMS,
  PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
  PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
] as const;

export type PermissionState = Record<string, boolean>;

export const PermissionsManager = {
  async requestInitialPermissions(): Promise<PermissionState> {
    if (Platform.OS !== 'android') {
      return {};
    }

    const status = await PermissionsAndroid.requestMultiple([
      ...REQUIRED_PERMISSIONS,
    ]);

    return Object.fromEntries(
      Object.entries(status).map(([k, v]) => [k, v === PermissionsAndroid.RESULTS.GRANTED]),
    );
  },

  async getPermissionState(): Promise<PermissionState> {
    if (Platform.OS !== 'android') {
      return {};
    }
    const checks = await Promise.all(
      REQUIRED_PERMISSIONS.map(async permission => [
        permission,
        await PermissionsAndroid.check(permission),
      ]),
    );

    return Object.fromEntries(checks);
  },

  showSettingsPrompt() {
    Alert.alert(
      'System Access',
      'Some optional permissions were denied. You can grant them later from Android settings.',
      [
        {text: 'Not now', style: 'cancel'},
        {text: 'Open Settings', onPress: () => Linking.openSettings()},
      ],
    );
  },
};
