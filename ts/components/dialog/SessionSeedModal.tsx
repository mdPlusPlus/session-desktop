import React, { MouseEvent, useEffect, useState } from 'react';

import { ToastUtils } from '../../session/utils';
import { matchesHash } from '../../util/passwordUtils';
import { Data } from '../../data/data';
import { QRCode } from 'react-qr-svg';
import { mn_decode } from '../../session/crypto/mnemonic';
import { SpacerSM } from '../basic/Text';
import { recoveryPhraseModal } from '../../state/ducks/modalDialog';
import { useDispatch } from 'react-redux';
import { SessionButton, SessionButtonColor, SessionButtonType } from '../basic/SessionButton';
import { SessionWrapperModal } from '../SessionWrapperModal';
import { getCurrentRecoveryPhrase } from '../../util/storage';
import styled from 'styled-components';
import { saveQRCode } from '../../util/saveQRCode';

interface PasswordProps {
  setPasswordValid: (val: boolean) => any;
  passwordHash: string;
}

const Password = (props: PasswordProps) => {
  const { setPasswordValid, passwordHash } = props;
  const i18n = window.i18n;
  const dispatch = useDispatch();

  const onClose = () => dispatch(recoveryPhraseModal(null));

  const confirmPassword = () => {
    const passwordValue = (document.getElementById('seed-input-password') as any)?.value;
    const isPasswordValid = matchesHash(passwordValue as string, passwordHash);

    if (!passwordValue) {
      ToastUtils.pushToastError('enterPasswordErrorToast', i18n('noGivenPassword'));

      return false;
    }

    if (passwordHash && !isPasswordValid) {
      ToastUtils.pushToastError('enterPasswordErrorToast', i18n('invalidPassword'));
      return false;
    }

    setPasswordValid(true);

    window.removeEventListener('keyup', onEnter);
    return true;
  };

  const onEnter = (event: any) => {
    if (event.key === 'Enter') {
      confirmPassword();
    }
  };

  return (
    <>
      <div className="session-modal__input-group">
        <input
          type="password"
          id="seed-input-password"
          placeholder={i18n('enterPassword')}
          onKeyUp={onEnter}
        />
      </div>

      <SpacerSM />

      <div
        className="session-modal__button-group"
        style={{ justifyContent: 'center', width: '100%' }}
      >
        <SessionButton
          text={i18n('done')}
          buttonType={SessionButtonType.Simple}
          onClick={confirmPassword}
        />
        <SessionButton
          text={i18n('cancel')}
          buttonType={SessionButtonType.Simple}
          buttonColor={SessionButtonColor.Danger}
          onClick={onClose}
        />
      </div>
    </>
  );
};

interface SeedProps {
  recoveryPhrase: string;
  onClickCopy?: () => any;
}

const StyledRecoveryPhrase = styled.i``;

const StyledQRImage = styled.div`
  width: fit-content;
  margin: 0 auto var(--margins-lg);
  cursor: pointer;
`;

const handleSaveQRCode = (event: MouseEvent) => {
  event.preventDefault();
  saveQRCode(
    'session-recovery-phrase',
    '220px',
    '220px',
    'var(--white-color)',
    'var(--black-color)'
  );
};

const Seed = (props: SeedProps) => {
  const { recoveryPhrase, onClickCopy } = props;
  const i18n = window.i18n;
  const bgColor = 'var(--white-color)';
  const fgColor = 'var(--black-color)';
  const dispatch = useDispatch();

  const hexEncodedSeed = mn_decode(recoveryPhrase, 'english');

  const copyRecoveryPhrase = (recoveryPhraseToCopy: string) => {
    window.clipboard.writeText(recoveryPhraseToCopy);
    ToastUtils.pushCopiedToClipBoard();
    if (onClickCopy) {
      onClickCopy();
    }
    dispatch(recoveryPhraseModal(null));
  };

  return (
    <>
      <div className="session-modal__centered text-center">
        <p
          className="session-modal__description"
          style={{
            lineHeight: '1.3333',
            marginTop: '0px',
            marginBottom: 'var(--margins-md)',
            maxWidth: '600px',
          }}
        >
          {i18n('recoveryPhraseSavePromptMain')}
        </p>

        <StyledQRImage
          aria-label={window.i18n('clickToTrustContact')}
          title={window.i18n('clickToTrustContact')}
          className="qr-image"
          onClick={handleSaveQRCode}
        >
          <QRCode value={hexEncodedSeed} bgColor={bgColor} fgColor={fgColor} level="L" />
        </StyledQRImage>

        <StyledRecoveryPhrase
          data-testid="recovery-phrase-seed-modal"
          className="session-modal__text-highlight"
        >
          {recoveryPhrase}
        </StyledRecoveryPhrase>
      </div>
      <div
        className="session-modal__button-group"
        style={{ justifyContent: 'center', width: '100%' }}
      >
        <SessionButton
          text={i18n('editMenuCopy')}
          buttonType={SessionButtonType.Simple}
          onClick={() => {
            copyRecoveryPhrase(recoveryPhrase);
          }}
        />
      </div>
    </>
  );
};

const StyledSeedModalContainer = styled.div`
  margin: var(--margins-md) var(--margins-sm);
`;

interface ModalInnerProps {
  onClickOk?: () => any;
}

const SessionSeedModalInner = (props: ModalInnerProps) => {
  const { onClickOk } = props;
  const [loadingPassword, setLoadingPassword] = useState(true);
  const [loadingSeed, setLoadingSeed] = useState(true);
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [hasPassword, setHasPassword] = useState<null | boolean>(null);
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordHash, setPasswordHash] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    setTimeout(() => (document.getElementById('seed-input-password') as any)?.focus(), 100);
    void checkHasPassword();
    void getRecoveryPhrase();
  }, []);

  const i18n = window.i18n;

  const onClose = () => dispatch(recoveryPhraseModal(null));

  const checkHasPassword = async () => {
    if (!loadingPassword) {
      return;
    }

    const hash = await Data.getPasswordHash();
    setHasPassword(!!hash);
    setPasswordHash(hash || '');
    setLoadingPassword(false);
  };

  const getRecoveryPhrase = async () => {
    if (recoveryPhrase) {
      return false;
    }
    const newRecoveryPhrase = getCurrentRecoveryPhrase();
    setRecoveryPhrase(newRecoveryPhrase);
    setLoadingSeed(false);

    return true;
  };

  return (
    <>
      {!loadingSeed && (
        <SessionWrapperModal
          title={i18n('showRecoveryPhrase')}
          onClose={onClose}
          showExitIcon={true}
        >
          <StyledSeedModalContainer>
            <SpacerSM />

            {hasPassword && !passwordValid ? (
              <Password passwordHash={passwordHash} setPasswordValid={setPasswordValid} />
            ) : (
              <Seed recoveryPhrase={recoveryPhrase} onClickCopy={onClickOk} />
            )}
          </StyledSeedModalContainer>
        </SessionWrapperModal>
      )}
    </>
  );
};

export const SessionSeedModal = SessionSeedModalInner;
