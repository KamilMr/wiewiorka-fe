#!/bin/bash

# Android Local Build and Install Script
# Builds APK, starts emulator if needed, and installs the app

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting local Android build process...${NC}"

# Set up Android environment
# export ANDROID_HOME=~/Library/Android/sdk
# export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
# export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"

# Build APK
echo -e "${YELLOW}📦 Building APK...${NC}"
npx eas build --profile local --local

# Find the latest APK file
APK_FILE=$(find . -name "*.apk" -type f -exec ls -t {} + | head -n1)

if [ -z "$APK_FILE" ]; then
    echo -e "${RED}❌ No APK file found!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ APK built: $APK_FILE${NC}"

# Check if emulator is running
RUNNING_EMULATOR=$(adb devices | grep -c "emulator.*device" || true)

if [ "$RUNNING_EMULATOR" -eq 0 ]; then
    echo -e "${YELLOW}📱 Starting emulator...${NC}"

    # List available AVDs and start the first one
    AVAILABLE_AVDS=$(emulator -list-avds | head -n1)

    if [ -z "$AVAILABLE_AVDS" ]; then
        echo -e "${RED}❌ No Android Virtual Devices found!${NC}"
        echo -e "${YELLOW}Please create an AVD in Android Studio first.${NC}"
        exit 1
    fi

    echo -e "${GREEN}Starting emulator: $AVAILABLE_AVDS${NC}"
    emulator -avd "$AVAILABLE_AVDS" -no-snapshot-save > /dev/null 2>&1 &

    # Wait for emulator to boot
    echo -e "${YELLOW}⏳ Waiting for emulator to boot...${NC}"
    adb wait-for-device

    # Additional wait for full boot
    sleep 10

    echo -e "${GREEN}✅ Emulator is ready!${NC}"
else
    echo -e "${GREEN}✅ Emulator already running${NC}"
fi

# Install APK
echo -e "${YELLOW}📲 Installing APK on emulator...${NC}"
adb install -r "$APK_FILE"

echo -e "${GREEN}🎉 Success! App installed on emulator${NC}"

# Optional: Launch the app
# echo -e "${YELLOW}🚀 Launching app...${NC}"
# adb shell monkey -p com.yourpackagename -c android.intent.category.LAUNCHER 1
