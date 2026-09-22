import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostWithAuthor } from '../types/database';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';
import CommentThread from './CommentThread';

interface CommentsSheetProps {
  visible: boolean;
  post: PostWithAuthor | null;
  onClose: () => void;
  onCommentCountChange: (postId: string, delta: number) => void;
}

export default function CommentsSheet({
  visible,
  post,
  onClose,
  onCommentCountChange,
}: CommentsSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ flex: 1, backgroundColor: Colors.overlay }}
      >
        {/* Sheet — stopPropagation so taps inside don't close */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '75%',
            backgroundColor: Colors.surfaceAlt,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderColor: Colors.border,
            overflow: 'hidden',
          }}
        >
          {/* Grab handle */}
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: Colors.whiteOverlay20,
              }}
            />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: Colors.borderSubtle,
            }}
          >
            <Text style={{ fontFamily: Fonts.heading, fontSize: 18, color: Colors.gold }}>
              Comments
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </Pressable>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {post ? (
              <CommentThread
                key={post.id}
                postId={post.id}
                onCommentCountChange={onCommentCountChange}
                onRequestClose={onClose}
                scrollable={true}
              />
            ) : null}
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
