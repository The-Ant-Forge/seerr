import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import Modal from '@app/components/Common/Modal';
import PageTitle from '@app/components/Common/PageTitle';
import defineMessages from '@app/utils/defineMessages';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';

const messages = defineMessages('components.Settings.SettingsBackup', {
  backup: 'Backup & Restore',
  createBackup: 'Create Backup',
  createBackupDescription:
    'Download a snapshot of your Seerr configuration and database.',
  downloadBackup: 'Download Backup',
  restoreBackup: 'Restore from Backup',
  restoreBackupDescription:
    'Upload a previously created backup to restore your Seerr instance.',
  restoreWarning:
    'This will overwrite all current settings and database. A pre-restore backup will be created automatically.',
  restoreConfirm:
    'Are you sure you want to restore? This will replace all settings and data. Seerr will restart after the restore completes.',
  restoreSuccess:
    'Restore successful. Seerr is restarting\u2026 The page will reload automatically.',
  restoreFailed: 'Restore failed: {error}',
  selectFile: 'Select Backup File',
  restore: 'Restore',
  sensitiveDataWarning:
    'Backups contain sensitive data including API keys, credentials, and password hashes. Store them securely.',
  noFileSelected: 'No file selected',
  restoring: 'Restoring\u2026',
});

const SettingsBackup = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleDownload = () => {
    window.location.href = '/api/v1/settings/backup';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleRestore = async () => {
    if (!selectedFile) return;

    setShowConfirmModal(false);
    setIsRestoring(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const response = await fetch('/api/v1/settings/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/zip' },
        body: buffer,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Restore failed');
      }

      addToast(intl.formatMessage(messages.restoreSuccess), {
        autoDismiss: false,
        appearance: 'success',
      });

      // Poll until server comes back, then reload
      const poll = setInterval(async () => {
        try {
          const res = await fetch('/api/v1/status');
          if (res.ok) {
            clearInterval(poll);
            window.location.reload();
          }
        } catch {
          // Server still restarting
        }
      }, 2000);
    } catch (e) {
      addToast(
        intl.formatMessage(messages.restoreFailed, {
          error: (e as Error).message,
        }),
        { autoDismiss: false, appearance: 'error' }
      );
      setIsRestoring(false);
    }
  };

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.backup),
          intl.formatMessage({ id: 'settings', defaultMessage: 'Settings' }),
        ]}
      />
      {showConfirmModal && (
        <Modal
          title={intl.formatMessage(messages.restoreBackup)}
          okText={intl.formatMessage(messages.restore)}
          okButtonType="danger"
          onOk={handleRestore}
          onCancel={() => setShowConfirmModal(false)}
        >
          {intl.formatMessage(messages.restoreConfirm)}
        </Modal>
      )}

      <div className="mb-6">
        <h3 className="heading">{intl.formatMessage(messages.createBackup)}</h3>
        <p className="description">
          {intl.formatMessage(messages.createBackupDescription)}
        </p>
        <Alert type="info">
          {intl.formatMessage(messages.sensitiveDataWarning)}
        </Alert>
        <div className="section">
          <Button buttonType="primary" onClick={handleDownload}>
            <ArrowDownTrayIcon />
            <span>{intl.formatMessage(messages.downloadBackup)}</span>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="heading">
          {intl.formatMessage(messages.restoreBackup)}
        </h3>
        <p className="description">
          {intl.formatMessage(messages.restoreBackupDescription)}
        </p>
        <Alert type="warning">
          {intl.formatMessage(messages.restoreWarning)}
        </Alert>
        <div className="section">
          <div className="flex items-center space-x-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              buttonType="default"
              onClick={() => fileInputRef.current?.click()}
            >
              <span>{intl.formatMessage(messages.selectFile)}</span>
            </Button>
            <span className="text-sm text-gray-400">
              {selectedFile?.name ??
                intl.formatMessage(messages.noFileSelected)}
            </span>
          </div>
          <div className="mt-4">
            <Button
              buttonType="danger"
              disabled={!selectedFile || isRestoring}
              onClick={() => setShowConfirmModal(true)}
            >
              <ArrowUpTrayIcon />
              <span>
                {isRestoring
                  ? intl.formatMessage(messages.restoring)
                  : intl.formatMessage(messages.restore)}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsBackup;
