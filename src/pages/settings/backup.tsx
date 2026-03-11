import SettingsBackup from '@app/components/Settings/SettingsBackup';
import SettingsLayout from '@app/components/Settings/SettingsLayout';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission } from '@app/hooks/useUser';
import type { NextPage } from 'next';

const SettingsBackupPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsBackup />
    </SettingsLayout>
  );
};

export default SettingsBackupPage;
