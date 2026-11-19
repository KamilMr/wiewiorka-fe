import {useRef, useState} from 'react';
import {format} from 'date-fns';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import {Redirect, router, useLocalSearchParams} from 'expo-router';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {formatPrice} from '@/common';
import {warmColors, warmRadius} from '@/constants/warmTheme';
import {useAppSelector} from '@/hooks';
import {selectToken} from '@/redux/auth/authSlice';
import {selectComparison} from '@/redux/main/selectors';
import {
  ChatAction,
  getChatDraft,
  getLocalChatReply,
  QUICK_CHAT_PROMPTS,
} from '@/utils/wiewiorkaChat';

const avatar = require('../assets/mascot/chat.png');
const MAX_MESSAGE_LENGTH = 500;
const MAX_MESSAGES = 50;
const actionLabels: Record<ChatAction, string> = {
  'add-expense': 'Otwórz formularz wydatku',
  'show-chart': 'Otwórz wykres wydatków',
  'show-budgets': 'Otwórz budżety',
};

type Message = {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  action?: ChatAction;
};

export default function Chat() {
  const token = useAppSelector(selectToken);
  const {prompt} = useLocalSearchParams<{prompt?: string}>();
  if (!token) return <Redirect href="/sign-in" />;
  return <ChatConversation key={token} initialDraft={getChatDraft(prompt)} />;
}

function ChatConversation({initialDraft}: {initialDraft: string}) {
  const now = new Date();
  const month = format(now, 'MM/yyyy');
  const monthStart = format(now, 'yyyy-MM-01');
  const summary = useAppSelector(state => selectComparison(state, 1));
  const outcome = summary.find(item => item.date === month)?.outcome ?? 0;
  const monthlySpend = formatPrice(outcome);
  const scrollRef = useRef<ScrollView>(null);
  const nextMessageId = useRef(0);
  const [input, setInput] = useState(initialDraft);
  const [messages, setMessages] = useState<Message[]>([]);
  const canSend = Boolean(input.trim());

  const scrollToLatest = () => {
    if (messages.length) scrollRef.current?.scrollToEnd({animated: true});
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const navigate = (action: ChatAction) => {
    switch (action) {
      case 'add-expense':
        router.push({pathname: '/(tabs)/addnew', params: {type: 'expense'}});
        break;
      case 'show-chart':
        router.push({
          pathname: '/summary/chart-details',
          params: {date: monthStart},
        });
        break;
      case 'show-budgets':
        router.push('/budget');
        break;
    }
  };

  const send = (value = input) => {
    const text = value.trim().replace(/\s+/g, ' ');
    if (!text) return;

    const reply = getLocalChatReply(text, monthlySpend);
    const userId = nextMessageId.current++;
    const replyId = nextMessageId.current++;
    setMessages(current => [
      ...current.slice(-(MAX_MESSAGES - 2)),
      {id: userId, role: 'user', text},
      {id: replyId, role: 'assistant', ...reply},
    ]);
    setInput('');
  };

  const renderAction = (action: ChatAction) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => navigate(action)}
      style={styles.actionButton}
    >
      <Text style={styles.actionText}>{actionLabels[action]}</Text>
    </Pressable>
  );

  const messageRows = messages.map(message => (
    <View
      key={message.id}
      style={[
        styles.messageRow,
        message.role === 'user' ? styles.userRow : styles.assistantRow,
      ]}
    >
      {message.role === 'assistant' && (
        <Image source={avatar} style={styles.smallAvatar} accessible={false} />
      )}
      <View
        style={[
          styles.bubble,
          message.role === 'user' ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text
          selectable
          style={
            message.role === 'user'
              ? styles.userMessage
              : styles.assistantMessage
          }
        >
          {message.text}
        </Text>
        {message.action && renderAction(message.action)}
      </View>
    </View>
  ));

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'right', 'bottom', 'left']}
    >
      <KeyboardAvoidingView
        behavior={Platform.select({ios: 'padding', android: undefined})}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Wróć do strony głównej"
            onPress={goBack}
            style={styles.backButton}
          >
            <FontAwesome6
              name="arrow-left"
              size={18}
              color={warmColors.foreground}
            />
          </Pressable>
          <Image source={avatar} style={styles.avatar} accessible={false} />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Wiewiórka</Text>
            <Text style={styles.subtitle}>Lokalny asystent finansowy</Text>
          </View>
          <View style={styles.monthTotal}>
            <Text style={styles.monthLabel}>TEN MIESIĄC</Text>
            <Text
              style={styles.monthValue}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {monthlySpend}
            </Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.keyboard}
          contentContainerStyle={styles.messages}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToLatest}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.day}>Dzisiaj</Text>
          <View style={[styles.messageRow, styles.assistantRow]}>
            <Image
              source={avatar}
              style={styles.smallAvatar}
              accessible={false}
            />
            <View style={[styles.bubble, styles.assistantBubble]}>
              <Text selectable style={styles.assistantMessage}>
                Cześć! Tutaj możesz sprawdzić wydatki i przejść do narzędzi.
                Wiadomości nie są zapisywane ani wysyłane poza aplikację.
              </Text>
            </View>
          </View>
          <View style={styles.spendRecap}>
            <Text style={styles.subtitle}>Wydatki w tym miesiącu</Text>
            <Text style={styles.spendValue}>{monthlySpend}</Text>
          </View>
          {messageRows}
        </ScrollView>

        <View style={styles.composerArea}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickPrompts}
            keyboardShouldPersistTaps="handled"
          >
            {QUICK_CHAT_PROMPTS.map(item => (
              <Pressable
                key={item}
                accessibilityRole="button"
                onPress={() => setInput(item)}
                style={styles.quickPrompt}
              >
                <Text style={styles.quickText}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.composer}>
            <TextInput
              accessibilityLabel="Wiadomość do Wiewiórki"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send()}
              onFocus={scrollToLatest}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Napisz do Wiewiórki..."
              placeholderTextColor={warmColors.mutedForeground}
              returnKeyType="send"
              style={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Wyślij wiadomość"
              accessibilityState={{disabled: !canSend}}
              disabled={!canSend}
              onPress={() => send()}
              style={[styles.send, !canSend && styles.sendDisabled]}
            >
              <FontAwesome6
                name="arrow-up"
                size={16}
                color={warmColors.primaryForeground}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {backgroundColor: warmColors.background, flex: 1},
  keyboard: {flex: 1},
  header: {
    alignItems: 'center',
    borderBottomColor: warmColors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 9,
    padding: 12,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: warmColors.card,
    borderColor: warmColors.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatar: {
    backgroundColor: warmColors.accent,
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  headerCopy: {flex: 1, minWidth: 0},
  title: {color: warmColors.foreground, fontSize: 16, fontWeight: '700'},
  subtitle: {color: warmColors.mutedForeground, fontSize: 11, marginTop: 2},
  monthTotal: {alignItems: 'flex-end', maxWidth: 88},
  monthLabel: {
    color: warmColors.mutedForeground,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  monthValue: {
    color: warmColors.foreground,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  messages: {gap: 12, padding: 16, paddingBottom: 24},
  day: {
    alignSelf: 'center',
    backgroundColor: warmColors.muted,
    borderRadius: warmRadius.pill,
    color: warmColors.mutedForeground,
    fontSize: 10,
    fontWeight: '600',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  messageRow: {alignItems: 'flex-end', flexDirection: 'row', gap: 7},
  assistantRow: {paddingRight: 28},
  userRow: {justifyContent: 'flex-end', paddingLeft: 40},
  smallAvatar: {
    backgroundColor: warmColors.accent,
    borderRadius: 14,
    height: 28,
    width: 28,
  },
  bubble: {
    borderRadius: warmRadius.xl,
    flexShrink: 1,
    minWidth: 0,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  assistantBubble: {
    backgroundColor: warmColors.card,
    borderColor: warmColors.border,
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  userBubble: {backgroundColor: warmColors.primary, borderBottomRightRadius: 4},
  spendRecap: {
    alignSelf: 'flex-start',
    backgroundColor: warmColors.card,
    borderColor: warmColors.border,
    borderRadius: warmRadius.xl,
    borderWidth: 1,
    marginLeft: 35,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  spendValue: {color: warmColors.foreground, fontSize: 22, fontWeight: '700'},
  assistantMessage: {
    color: warmColors.foreground,
    fontSize: 14,
    lineHeight: 20,
  },
  userMessage: {
    color: warmColors.primaryForeground,
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: warmColors.accent,
    borderRadius: warmRadius.pill,
    justifyContent: 'center',
    marginTop: 9,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionText: {color: warmColors.primary, fontSize: 12, fontWeight: '700'},
  composerArea: {
    borderTopColor: warmColors.border,
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
  },
  quickPrompts: {gap: 8, paddingHorizontal: 16, paddingBottom: 8},
  quickPrompt: {
    backgroundColor: warmColors.card,
    borderColor: warmColors.border,
    borderRadius: warmRadius.pill,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickText: {color: warmColors.foreground, fontSize: 12, fontWeight: '600'},
  composer: {
    alignItems: 'center',
    backgroundColor: warmColors.card,
    borderColor: warmColors.border,
    borderRadius: warmRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 16,
    minHeight: 48,
    paddingLeft: 14,
    paddingRight: 5,
  },
  input: {
    color: warmColors.foreground,
    flex: 1,
    fontSize: 14,
    maxHeight: 96,
    paddingVertical: 8,
  },
  send: {
    alignItems: 'center',
    backgroundColor: warmColors.primary,
    borderRadius: 20,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sendDisabled: {opacity: 0.45},
});
