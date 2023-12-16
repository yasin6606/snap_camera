import React, {useState, useEffect, useRef} from 'react';
import {activateKeepAwake, deactivateKeepAwake} from 'expo-keep-awake';
import {StyleSheet, Text, View, TouchableOpacity, Button, Modal, TextInput, Pressable} from 'react-native';
import {Camera, CameraType} from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import axios from "axios";

let interVal;

export default function App() {
    const [hasPermission, setHasPermission] = useState(null);
    const [type, setType] = useState(CameraType.back);
    const [btn, setBtn] = useState({loading: false});
    const [address, setAddress] = useState({value: "", error: "", isConnected: false, connectBtnLoading: false});
    const [time, setTime] = useState({value: 3000, isInvalid: false});
    const [modalVisible, setModalVisible] = useState(false);
    const [picError, setPicError] = useState("");
    const [count, setCount] = useState(0);
    const [queue, setQueue] = useState([]);

    const ref = useRef(null);

    useEffect(() => {
        (async () => {
            const {status} = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();

        // check connection to server every 4 seconds
    }, []);

    useEffect(() => {
        if (queue.length > 0 && queue[count])
            (async () => {
                await sending();
            })();
    }, [queue.length])

    if (hasPermission === null) {
        return <View/>;
    }

    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }

    // send took photo to server
    const sending = () => {
        return new Promise(async (resolve, reject) => {
            try {
                // get picture name
                const fileName = `IMG-${count}.jpg`

                await FileSystem.uploadAsync(
                    address.value,
                    queue[count].uri,
                    {
                        httpMethod: "POST",
                        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
                        fieldName: "photo",
                        mimeType: "image/jpg",
                        parameters: {fileName}
                    }
                );

                // remove sent successfully image
                setQueue(prevState => prevState.filter((_, i) => i !== 0));

                setCount(prevState => prevState + 1);
                resolve();
            } catch (err) {
                console.error(err.message);
                setPicError("SEND photo error ==> " + err.message);
                reject(err);
            }
        });
    }

    const taking = () => {

        // prevent screen from being turned off
        activateKeepAwake().then();

        setBtn({...btn, loading: true});

        interVal = setInterval(async () => {
            let photo;

            try {
                photo = await ref.current.takePictureAsync({base64: false});
                photo = {...photo, "id": count}

                // add new photo into the queue
                setQueue(prevState => [...prevState, photo]);
            } catch (err) {
                // console.error(err)
                setPicError("Taking photo error ==> " + err.message);
            }

        }, time.value);
    };

    const stopping = () => {

        // let screen to being turned off
        deactivateKeepAwake().then();

        setBtn({...btn, loading: false});

        // empty queue
        setQueue([]);
        setCount(0);

        clearInterval(interVal);
    };

    const flipHandler = () => {
        setType(type === CameraType.back ? CameraType.front : CameraType.back);
    };

    const getTimerHandler = (inputTime) => {
        if (Number(inputTime) < time.value) {
            setTime({value: inputTime, isInvalid: true});

            return;
        }

        setTime({value: Number(inputTime), isInvalid: false});
    };

    const getAddressHandler = (text) => {
        setAddress({value: text, error: ""});
    };

    const checkConnection = async () => await axios.get(address.value, {timeout: 3000});

    const checkConnectionInterval = async () => {
        setInterval(async () => {
            try {
                await checkConnection();

                setAddress({...address, error: "", isConnected: true});
            } catch (e) {
                setAddress({...address, error: "Check Your Connection to The Server", isConnected: false});
            }
        }, 4000);
    };

    const closeModal = async () => {
        try {
            setAddress({...address, connectBtnLoading: true});

            await checkConnection();

            setModalVisible(false);
            setAddress({...address, error: "", isConnected: true, connectBtnLoading: false});

            await checkConnectionInterval();
        } catch (e) {
            console.error(e);
            setAddress({
                ...address,
                error: "Can not Connect to This Address (Address Not Found)",
                isConnected: false,
                connectBtnLoading: false
            });
            // TODO show error
        }
    };

    const showModalHandler = () => {
        setModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <View>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                >
                    <View style={{flex: 1, justifyContent: "center"}}>
                        <View style={styles.modalView}>
                            <View style={styles.modalRow}>
                                <View>
                                    <Text style={styles.modalText}>Set Address</Text>
                                </View>
                                <View style={styles.inputView}>
                                    <TextInput
                                        autoFocus={true}
                                        onChangeText={getAddressHandler}
                                        placeholder="E.X: http://172.20.10.4:3030"
                                        keyboardType="url"
                                        style={styles.inputStyle}
                                        value={address.value}
                                    />
                                </View>
                                {
                                    !!address.error &&
                                    <View>
                                        <Text style={styles.errorText}>{address.error}</Text>
                                    </View>
                                }
                            </View>
                            <View style={styles.modalRow}>
                                <View>
                                    <Text style={styles.modalText}> Set Repeat Time (milliSec)</Text>
                                </View>
                                <View style={styles.inputView}>
                                    <TextInput
                                        autoFocus={true}
                                        onChangeText={getTimerHandler}
                                        placeholder="milliseconds... (number)"
                                        keyboardType="number-pad"
                                        style={styles.inputStyle}
                                        value={String(time.value)}
                                    />
                                </View>
                                {
                                    time.isInvalid &&
                                    <View>
                                        <Text style={styles.errorText}>Enter valid number ({time.value}, ...)</Text>
                                    </View>
                                }
                            </View>
                            <View style={{paddingTop: 20}}>
                                <Pressable
                                    style={
                                        address.connectBtnLoading || address.value.length === 0 ?
                                            {...styles.button, ...styles.buttonClose, ...styles.disBtn}
                                            :
                                            {...styles.button, ...styles.buttonClose}
                                    }
                                    onPress={closeModal}
                                    disabled={address.connectBtnLoading}
                                    android_ripple={{color: 'green'}}
                                >
                                    <Text
                                        style={styles.textStyle}
                                        children={address.connectBtnLoading ? "..." : "Connect"}
                                    />
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
            <Camera
                style={styles.camera}
                type={type}
                ratio="16:9"
                ref={ref}
                autoFocus="on"
                focusDepth={0}
            >
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.circleBtn} onPress={showModalHandler}>
                        <Text style={styles.btnText}> Setting </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.circleBtn} onPress={flipHandler}>
                        <Text style={styles.btnText}> Flip </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.lastImgLabel}>
                        <Text style={styles.btnText}> Last Image Num: {count} </Text>
                    </TouchableOpacity>
                    <View style={styles.circleBtn}>
                        <View
                            style={
                                address.isConnected ?
                                    {...styles.connectionIcon, ...styles.connectedColor}
                                    :
                                    {...styles.connectionIcon, ...styles.disconnectedColor}
                            }
                        />
                    </View>
                </View>
            </Camera>
            {
                !!picError &&
                <View>
                    <Text style={{color: "red"}}>{picError}</Text>
                </View>
            }
            <View style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-around",
                paddingTop: 15,
                paddingBottom: 15
            }}>
                <View>
                    <Button
                        style={{display: "flex", height: "min-content", backgroundColor: "red"}}
                        onPress={taking}
                        title={"Start"}
                        disabled={btn.loading || address.value.length <= 0}
                    />
                </View>
                <View>
                    <Button
                        style={{display: "flex", height: "min-content", backgroundColor: "red"}}
                        onPress={stopping}
                        title={"Stop"}
                        color="red"
                        disabled={!btn.loading}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 25,
        backgroundColor: "lightgray"
    },
    camera: {
        flex: 1,
        marginTop: 10
    },
    buttonContainer: {
        display: "flex",
        justifyContent: "space-around",
        backgroundColor: "transparent",
        flexDirection: "row",
        marginTop: 10
    },
    button: {
        backgroundColor: "gray",
        borderRadius: 50,
        marginTop: 8
    },
    text: {
        fontSize: 18,
        color: 'white'
    },
    modalView: {
        display: "flex",
        flexDirection: "column",
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        paddingHorizontal: 35,
        paddingVertical: 15,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    buttonClose: {
        backgroundColor: "#2196F3",
        padding: 7
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    },
    modalText: {
        marginTop: 15,
        marginBottom: 5,
        textAlign: "center"
    },
    circleBtn: {
        backgroundColor: "white",
        marginTop: 3,
        borderWidth: 3,
        borderColor: 'rgba(255,0,0)',
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
        borderRadius: 50
    },
    connectionIcon: {
        borderRadius: 50,
        width: 15,
        height: 15,
    },
    connectedColor: {
        backgroundColor: "green"
    },
    disconnectedColor: {
        backgroundColor: "red"
    },
    lastImgLabel: {
        backgroundColor: "white",
        marginTop: 3,
        borderWidth: 3,
        borderColor: 'rgba(255,0,0)',
        alignItems: 'center',
        justifyContent: 'center',
        width: 160,
        height: 50,
        borderRadius: 50
    },
    btnText: {
        fontSize: 9,
        color: "black"
    },
    modalRow: {
        width: "100%",
        paddingBottom: 10
    },
    errorText: {
        fontSize: 9,
        color: "red"
    },
    inputView: {
        width: "100%"
    },
    inputStyle: {
        borderWidth: 0.5,
        padding: 5,
        display: "flex",
        justifyContent: "center"
    },
    disBtn: {
        backgroundColor: "gray"
    }
});