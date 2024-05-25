/* eslint-disable react/jsx-no-bind */
import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { isNameReadOnly } from '../../../base/config/functions.web';
import { IconArrowDown, IconArrowUp, IconPhoneRinging, IconVolumeOff } from '../../../base/icons/svg';
import { isVideoMutedByUser } from '../../../base/media/functions';
import { getLocalParticipant } from '../../../base/participants/functions';
import Popover from '../../../base/popover/components/Popover.web';
import ActionButton from '../../../base/premeeting/components/web/ActionButton';
import PreMeetingScreen from '../../../base/premeeting/components/web/PreMeetingScreen';
import { updateSettings } from '../../../base/settings/actions';
import { getDisplayName } from '../../../base/settings/functions.web';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { getLocalJitsiVideoTrack } from '../../../base/tracks/functions.web';
import Button from '../../../base/ui/components/web/Button';
import Input from '../../../base/ui/components/web/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import isInsecureRoomName from '../../../base/util/isInsecureRoomName';
import { openDisplayNamePrompt } from '../../../display-name/actions';
import { isUnsafeRoomWarningEnabled } from '../../../prejoin/functions';
import {
    joinConference as joinConferenceAction,
    joinConferenceWithoutAudio as joinConferenceWithoutAudioAction,
    setJoinByPhoneDialogVisiblity as setJoinByPhoneDialogVisiblityAction
} from '../../actions.web';
import {
    isDeviceStatusVisible,
    isDisplayNameRequired,
    isJoinByPhoneButtonVisible,
    isJoinByPhoneDialogVisible,
    isPrejoinDisplayNameVisible
} from '../../functions';
import { hasDisplayName } from '../../utils';
// import { updateSettings } from '../../../base/settings/actions';

import JoinByPhoneDialog from './dialogs/JoinByPhoneDialog';
import PsdCheck from './dialogs/PsdCheck'
import {
    LOCAL_RECORDING_NOTIFICATION_ID,
    NOTIFICATION_TIMEOUT_TYPE,
    NOTIFICATION_TYPE,
    RAISE_HAND_NOTIFICATION_ID
} from '../../../notifications/constants';
import { showNotification } from '../../../notifications/actions';
interface IProps {

    /**
     * Flag signaling if the device status is visible or not.
     */
    deviceStatusVisible: boolean;

    /**
     * If join by phone button should be visible.
     */
    hasJoinByPhoneButton: boolean;

    /**
     * Flag signaling if the display name is visible or not.
     */
    isDisplayNameVisible: boolean;

    /**
     * Joins the current meeting.
     */
    joinConference: Function;

    /**
     * Joins the current meeting without audio.
     */
    joinConferenceWithoutAudio: Function;

    /**
     * Whether conference join is in progress.
     */
    joiningInProgress?: boolean;

    /**
     * The name of the user that is about to join.
     */
    name: string;

    /**
     * Local participant id.
     */
    participantId?: string;

    /**
     * The prejoin config.
     */
    prejoinConfig?: any;

    /**
     * Whether the name input should be read only or not.
     */
    readOnlyName: boolean;

    /**
     * Sets visibility of the 'JoinByPhoneDialog'.
     */
    setJoinByPhoneDialogVisiblity: Function;

    /**
     * Flag signaling the visibility of camera preview.
     */
    showCameraPreview: boolean;

    /**
     * If 'JoinByPhoneDialog' is visible or not.
     */
    showDialog: boolean;

    /**
     * If should show an error when joining without a name.
     */
    showErrorOnJoin: boolean;

    /**
     * If should show unsafe room warning when joining.
     */
    showUnsafeRoomWarning: boolean;

    /**
     * Whether the user has approved to join a room with unsafe name.
     */
    unsafeRoomConsent?: boolean;

    /**
     * Updates settings.
     */
    updateSettings: Function;

    /**
     * The JitsiLocalTrack to display.
     */
    videoTrack?: Object;

    room?: String;
}

const useStyles = makeStyles()(theme => {
    return {
        inputContainer: {
            width: '100%'
        },

        input: {
            width: '100%',
            marginBottom: theme.spacing(3),

            '& input': {
                textAlign: 'center'
            }
        },

        avatarContainer: {
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column'
        },

        avatar: {
            margin: `${theme.spacing(2)} auto ${theme.spacing(3)}`
        },

        avatarName: {
            ...withPixelLineHeight(theme.typography.bodyShortBoldLarge),
            color: theme.palette.text01,
            marginBottom: theme.spacing(5),
            textAlign: 'center'
        },

        error: {
            backgroundColor: theme.palette.actionDanger,
            color: theme.palette.text01,
            borderRadius: theme.shape.borderRadius,
            width: '100%',
            ...withPixelLineHeight(theme.typography.labelRegular),
            boxSizing: 'border-box',
            padding: theme.spacing(1),
            textAlign: 'center',
            marginTop: `-${theme.spacing(2)}`,
            marginBottom: theme.spacing(3)
        },

        dropdownContainer: {
            position: 'relative',
            width: '100%'
        },

        dropdownButtons: {
            width: '300px',
            padding: '8px 0',
            backgroundColor: theme.palette.action02,
            color: theme.palette.text04,
            borderRadius: theme.shape.borderRadius,
            position: 'relative',
            top: `-${theme.spacing(3)}`
        }
    };
});

const Prejoin = ({
    deviceStatusVisible,
    hasJoinByPhoneButton,
    isDisplayNameVisible,
    joinConference,
    joinConferenceWithoutAudio,
    joiningInProgress,
    name,
    participantId,
    prejoinConfig,
    readOnlyName,
    setJoinByPhoneDialogVisiblity,
    showCameraPreview,
    showDialog,
    showErrorOnJoin,
    showUnsafeRoomWarning,
    unsafeRoomConsent,
    updateSettings: dispatchUpdateSettings,
    videoTrack,
    room,
}: IProps) => {
    const showDisplayNameField = useMemo(
        () => isDisplayNameVisible && !readOnlyName,
        [isDisplayNameVisible, readOnlyName]);
    const showErrorOnField = useMemo(
        () => showDisplayNameField && showErrorOnJoin,
        [showDisplayNameField, showErrorOnJoin]);
    const [showJoinByPhoneButtons, setShowJoinByPhoneButtons] = useState(false);
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [password, setPassword] = useState('');
    useEffect(() => {
        if (!params.token && !localStorage.getItem('token')) {
            gotoLogin()
        } else {
            if (params.token) {
                localStorage.setItem('token', params.token as string)
                localStorage.setItem('userId', params.userId as string)
            }
            getMeetingConfigInfo(room)
        }

    }, [])
    interface Iparams {
        userId?: string;
        token?: string;
    }
    function getQueryParams() {
        const queryParams: any = {};
        const queryString = window.location.search.substring(1);
        const pairs = queryString.split('&');

        for (let pair of pairs) {
            const [key, value] = pair.split('=');
            queryParams[decodeURIComponent(key)] = decodeURIComponent(value);
        }

        return queryParams;
    }
    const gotoLogin = () => {
        let transferLoginDomain = 'https://gannan-research-institute-mhbd.yymt.com/test'; // 测试环境
        location.href = `${transferLoginDomain}/#/transferLogin?redirect=${window.location.href}&from=jistiMeet`
    }

    const params: Iparams = getQueryParams();
    /**
    * 获取链接的会议号，得到会议设置信息
    */
    const [showPsdDialog, setShowPsdDialog] = useState(false);
    /**
     * 判断主持人是否入会
     */
    const getModeratorHasMeeting = () => {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch('xmpp-websocket/lyh');
                if (!response.ok) {
                    reject('请求失败')
                    throw new Error('Network response was not ok');
                }
                // 处理返回的数据
                const res: any = await response.json();
                resolve(res)
                console.log(res);
            } catch (error) {
                reject('请求失败')
                console.error('There was a problem with your fetch operation:', error);
            }
        })
    }
    /**
     * 获取会议配置信息
     * @param roomName
     */
    const getMeetingConfigInfo = async (roomName?: String) => {
        const queryInfo = {
            meetId: roomName,
            userId: params.userId || localStorage.getItem('userId')
        }
        fetch('auth/meeting/userMeetPreConfig', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': (params.token || localStorage.getItem('token')) as string
            },
            body: JSON.stringify(queryInfo)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(async (res) => {
                if (res.code === 0) {
                    dispatchUpdateSettings({
                        meetTopic: res.data.meetTopic,
                        startWithAudioMuted: res.data.isMutedAudio,
                        startWithVideoMuted: res.data.isMutedVideo,
                        userId: params.userId || localStorage.getItem('userId'),
                        token: params.token || localStorage.getItem('token'),
                    })
                    if (res.data.isModerator === 0 && res.data.hostJoinedMeetingBeforeEnable === 1) {
                        // 非主持人且设置为需主持人先入会的情况下
                        getModeratorHasMeeting().then((moderatorRes: any) => {
                            let roomStr = String(room);
                            const regex = new RegExp(`\\b${roomStr}\\b`);
                            if (moderatorRes && !regex.test(moderatorRes)) {
                                // 已开启会议中不含目前会议，暂不入会
                                dispatch(showNotification({
                                    appearance: NOTIFICATION_TYPE.ERROR,
                                    titleKey: '123343',
                                    title: '警告',
                                    descriptionKey: '主持人未入会，请稍后重试',
                                    uid: LOCAL_RECORDING_NOTIFICATION_ID
                                }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));

                            } else {
                                setPassword(res.data.password)
                                if (res.data.password) {
                                    // 校验入会密码
                                    setShowPsdDialog(true)
                                } else {
                                    // 没有入会密码，直接入会
                                    onJoinButtonClick()
                                }
                            }
                        }).catch(err => {
                            dispatch(showNotification({
                                appearance: NOTIFICATION_TYPE.ERROR,
                                titleKey: '123343',
                                title: '警告',
                                descriptionKey: '请求失败',
                                uid: LOCAL_RECORDING_NOTIFICATION_ID
                            }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
                        });


                    } else {
                        setPassword(res.data.password)
                        if (res.data.password) {
                            // 校验入会密码
                            setShowPsdDialog(true)
                        } else {
                            // 没有入会密码，直接入会
                            onJoinButtonClick()
                        }
                    }
                    setName(res.data.nickName)
                } else {
                    if ([104, 1001, 1003, 1004].includes(res.code)) {
                        // token失效，重新登录
                        localStorage.removeItem('token');
                        localStorage.removeItem('userId')
                        gotoLogin()
                    }
                    setName('')
                    dispatch(showNotification({
                        appearance: NOTIFICATION_TYPE.ERROR,
                        titleKey: '123343',
                        title: '警告',
                        descriptionKey: res.msg,
                        uid: LOCAL_RECORDING_NOTIFICATION_ID
                    }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
                }
            })
            .catch(error => {
                console.error('There was a problem with your fetch operation:', error);
            });
    }
    /**
     * 加入会议
     */
    const reJoinMeeting = () => {
        getMeetingConfigInfo(room)
    }
    const handlePsd = (isCorrect: Boolean) => {
        console.log(isCorrect, 'isCorrect----')
        if (isCorrect) {
            onJoinButtonClick()
        }
    }
    const cancalPsd = () => {
        setShowPsdDialog(false)
    }

    /**
     * Handler for the join button.
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    const onJoinButtonClick = () => {
        if (showErrorOnJoin) {
            dispatch(openDisplayNamePrompt({
                onPostSubmit: joinConference,
                validateInput: hasDisplayName
            }));

            return;
        }
        joinConference();
    };

    /**
     * Closes the dropdown.
     *
     * @returns {void}
     */
    const onDropdownClose = () => {
        setShowJoinByPhoneButtons(false);
    };

    /**
     * Displays the join by phone buttons dropdown.
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    const onOptionsClick = (e?: React.KeyboardEvent | React.MouseEvent | undefined) => {
        e?.stopPropagation();

        setShowJoinByPhoneButtons(show => !show);
    };

    /**
     * Sets the guest participant name.
     *
     * @param {string} displayName - Participant name.
     * @returns {void}
     */
    const setName = (displayName: string) => {
        dispatchUpdateSettings({
            displayName
        });
    };

    /**
     * Closes the join by phone dialog.
     *
     * @returns {undefined}
     */
    const closeDialog = () => {
        setJoinByPhoneDialogVisiblity(false);
    };

    /**
     * Displays the dialog for joining a meeting by phone.
     *
     * @returns {undefined}
     */
    const doShowDialog = () => {
        setJoinByPhoneDialogVisiblity(true);
        onDropdownClose();
    };

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    const showDialogKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            doShowDialog();
        }
    };

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    const onJoinConferenceWithoutAudioKeyPress = (e: React.KeyboardEvent) => {
        if (joinConferenceWithoutAudio
            && (e.key === ' '
                || e.key === 'Enter')) {
            e.preventDefault();
            joinConferenceWithoutAudio();
        }
    };

    /**
     * Gets the list of extra join buttons.
     *
     * @returns {Object} - The list of extra buttons.
     */
    const getExtraJoinButtons = () => {
        const noAudio = {
            key: 'no-audio',
            testId: 'prejoin.joinWithoutAudio',
            icon: IconVolumeOff,
            label: t('prejoin.joinWithoutAudio'),
            onClick: joinConferenceWithoutAudio,
            onKeyPress: onJoinConferenceWithoutAudioKeyPress
        };

        const byPhone = {
            key: 'by-phone',
            testId: 'prejoin.joinByPhone',
            icon: IconPhoneRinging,
            label: t('prejoin.joinAudioByPhone'),
            onClick: doShowDialog,
            onKeyPress: showDialogKeyPress
        };

        return {
            noAudio,
            byPhone
        };
    };

    /**
     * Handle keypress on input.
     *
     * @param {KeyboardEvent} e - Keyboard event.
     * @returns {void}
     */
    const onInputKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            joinConference();
        }
    };

    const extraJoinButtons = getExtraJoinButtons();
    let extraButtonsToRender = Object.values(extraJoinButtons).filter((val: any) =>
        !(prejoinConfig?.hideExtraJoinButtons || []).includes(val.key)
    );

    if (!hasJoinByPhoneButton) {
        extraButtonsToRender = extraButtonsToRender.filter((btn: any) => btn.key !== 'by-phone');
    }
    const hasExtraJoinButtons = Boolean(extraButtonsToRender.length);

    return (
        <PreMeetingScreen
            showDeviceStatus={deviceStatusVisible}
            showUnsafeRoomWarning={showUnsafeRoomWarning}
            title={t('prejoin.joinMeeting')}
            videoMuted={!showCameraPreview}
            videoTrack={videoTrack}>
            <div
                className={classes.inputContainer}
                data-testid='prejoin.screen'>
                {!showDisplayNameField ? (<Input
                    accessibilityLabel={t('dialog.enterDisplayName')}
                    autoComplete={'name'}
                    autoFocus={true}
                    className={classes.input}
                    error={showErrorOnField}
                    id='premeeting-name-input'
                    onChange={setName}
                    onKeyPress={showUnsafeRoomWarning && !unsafeRoomConsent ? undefined : onInputKeyPress}
                    placeholder={t('dialog.enterDisplayName')}
                    readOnly={readOnlyName}
                    value={name} />
                ) : (
                    <div className={classes.avatarContainer}>
                        <Avatar
                            className={classes.avatar}
                            displayName={name}
                            participantId={participantId}
                            size={72} />
                        {isDisplayNameVisible && <div className={classes.avatarName}>{name}</div>}
                    </div>
                )}

                {showErrorOnField && <div
                    className={classes.error}
                    data-testid='prejoin.errorMessage'>{t('prejoin.errorMissingName')}</div>}

                <div className={classes.dropdownContainer}>
                    <Popover
                        content={hasExtraJoinButtons && <div className={classes.dropdownButtons}>
                            {extraButtonsToRender.map(({ key, ...rest }) => (
                                <Button
                                    disabled={joiningInProgress || showErrorOnField}
                                    fullWidth={true}
                                    key={key}
                                    type={BUTTON_TYPES.SECONDARY}
                                    {...rest} />
                            ))}
                        </div>}
                        onPopoverClose={onDropdownClose}
                        position='bottom'
                        trigger='click'
                        visible={showJoinByPhoneButtons}>
                        <ActionButton
                            OptionsIcon={showJoinByPhoneButtons ? IconArrowUp : IconArrowDown}
                            ariaDropDownLabel={t('prejoin.joinWithoutAudio')}
                            ariaLabel={t('prejoin.joinMeeting')}
                            ariaPressed={showJoinByPhoneButtons}
                            disabled={joiningInProgress
                                || (showUnsafeRoomWarning && !unsafeRoomConsent)
                                || showErrorOnField}
                            hasOptions={hasExtraJoinButtons}
                            onClick={reJoinMeeting}
                            onOptionsClick={onOptionsClick}
                            role='button'
                            tabIndex={0}
                            testId='prejoin.joinMeeting'
                            type='primary'>
                            {t('prejoin.joinMeeting')}
                        </ActionButton>
                    </Popover>
                </div>
            </div>
            {showDialog && (
                <JoinByPhoneDialog
                    joinConferenceWithoutAudio={joinConferenceWithoutAudio}
                    onClose={closeDialog} />
            )}

            {showPsdDialog && (
                <PsdCheck confirmPsd={handlePsd} cancelPsd={cancalPsd} correctPassword={password} />
            )}
        </PreMeetingScreen>
    );
};


/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState) {
    const name = getDisplayName(state);
    const showErrorOnJoin = isDisplayNameRequired(state) && !name;
    const { id: participantId } = getLocalParticipant(state) ?? {};
    const { joiningInProgress } = state['features/prejoin'];
    const { room } = state['features/base/conference'];
    const { unsafeRoomConsent } = state['features/base/premeeting'];

    return {
        deviceStatusVisible: isDeviceStatusVisible(state),
        hasJoinByPhoneButton: isJoinByPhoneButtonVisible(state),
        isDisplayNameVisible: isPrejoinDisplayNameVisible(state),
        joiningInProgress,
        name,
        participantId,
        prejoinConfig: state['features/base/config'].prejoinConfig,
        readOnlyName: isNameReadOnly(state),
        showCameraPreview: !isVideoMutedByUser(state),
        showDialog: isJoinByPhoneDialogVisible(state),
        showErrorOnJoin,
        showUnsafeRoomWarning: isInsecureRoomName(room) && isUnsafeRoomWarningEnabled(state),
        unsafeRoomConsent,
        videoTrack: getLocalJitsiVideoTrack(state),
        room,
    };
}

const mapDispatchToProps = {
    joinConferenceWithoutAudio: joinConferenceWithoutAudioAction,
    joinConference: joinConferenceAction,
    setJoinByPhoneDialogVisiblity: setJoinByPhoneDialogVisiblityAction,
    updateSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(Prejoin);
