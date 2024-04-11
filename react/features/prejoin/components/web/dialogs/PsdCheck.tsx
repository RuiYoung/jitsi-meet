import React, { useEffect, useRef, useState } from 'react';
import { connect, useDispatch } from 'react-redux';
import Dialog from '../../../../base/ui/components/web/Dialog';
import { makeStyles } from 'tss-react/mui';
import {
    LOCAL_RECORDING_NOTIFICATION_ID,
    NOTIFICATION_TIMEOUT_TYPE,
    NOTIFICATION_TYPE,
    RAISE_HAND_NOTIFICATION_ID
} from '../../../../notifications/constants';
import { showNotification } from '../../../../notifications/actions';
const useStyles = makeStyles()(theme => {
    return {
        container: {
            border: 0,
            margin: '10px 0',
            borderRadius: theme.shape.borderRadius,
            display: 'flex',
            backgroundColor: theme.palette.ui03
        },

        input: {
            padding: '5px 4px',
            margin: 0,
            border: 0,
            background: 'transparent',
            color: theme.palette.text01,
            flexGrow: 1,
            // ...withPixelLineHeight(theme.typography.bodyShortRegular)
        }
    };
});
interface IProps {
    confirmPsd: (isCorrect: Boolean) => void;
    cancelPsd: () => void;
    correctPassword?: string
}
const PsdCheck = ({
    confirmPsd,
    cancelPsd,
    correctPassword,
}:IProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [password, setPassword] = useState('');
    const { classes } = useStyles();
    const dispatch = useDispatch();
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const onKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            // e.preventDefault();
            // props.onSubmit();
            // setPassword(e.target.value)
        }
    };
    // 输入框内容变化时调用的函数
    const handleInputChange = (event: any) => {
        setPassword(event.target.value);
    };
    const handleSubmit = () => {
        if (correctPassword === password) {
            confirmPsd(true)
            return;
        }
        dispatch(showNotification({
            appearance: NOTIFICATION_TYPE.ERROR,
            titleKey: 'notify.somebody',
            title: '错误',
            descriptionKey: '密码输入错误, 请核对后重新输入',
            uid: LOCAL_RECORDING_NOTIFICATION_ID
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
    }
    return (
        <Dialog
            cancel={{ hidden: true }}
            ok={{ hidden: false, translationKey: '确认' }}
            onSubmit={handleSubmit}
            onCancel={cancelPsd}
            titleKey='lobby.enterPasswordTitle'>
            <div className={classes.container}>
                <input
                    className={classes.input}
                    onChange={handleInputChange}
                    onKeyPress={onKeyPress}
                    ref={inputRef}
                    value={password} />
            </div>
        </Dialog>
    )
}

export default PsdCheck