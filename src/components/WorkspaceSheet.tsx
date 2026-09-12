import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export type WorkspacePage = 'sources' | 'priorities' | 'notifications' | 'settings' | null;

export function WorkspaceSheet({ page, onClose }: { page: WorkspacePage; onClose: () => void }) {
  if (!page) return null;
  const title = page === 'sources' ? 'Connected sources' : page.charAt(0).toUpperCase() + page.slice(1);

  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent transparent visible>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={styles.card}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{title}</Text>
              {page === 'sources' ? (
                <Text style={styles.subtitle}>Bring deadlines, meetings and calendar events into one timeline.</Text>
              ) : null}
            </View>
            <Pressable onPress={onClose}><Text style={styles.close}>×</Text></Pressable>
          </View>

          {page === 'sources' && (
            <>
              <SourceRow
                name="Microsoft 365"
                detail="Outlook calendar, Teams meetings and assigned work"
                action="Connect"
              />
              <SourceRow
                name="Google Calendar"
                detail="Classes, personal events and shared calendars"
                action="Connect"
              />
              <SourceRow
                name="Moodle / LMS"
                detail="Coursework, assessments and due dates"
                action="Coming soon"
                muted
              />
              <SourceRow
                name="Device calendar"
                detail="Events already saved on this device"
                action="Coming soon"
                muted
              />
              <Text style={styles.sourceNote}>Imported items can be previewed before they are added to your workload.</Text>
            </>
          )}

          {page === 'priorities' && ['University', 'Health', 'Work', 'Personal', 'Social'].map((item, index) => (
            <View key={item} style={styles.priorityRow}>
              <Text style={styles.index}>{index + 1}</Text>
              <Text style={styles.priorityName}>{item}</Text>
              <Text style={styles.drag}>≡</Text>
            </View>
          ))}
          {page === 'notifications' && <Text style={styles.helper}>Only meaningful workload changes should trigger notifications.</Text>}
          {page === 'settings' && <Text style={styles.helper}>Preferences and appearance will live here.</Text>}
        </View>
      </View>
    </Modal>
  );
}

function SourceRow({ name, detail, action, muted = false }: { name: string; detail: string; action: string; muted?: boolean }) {
  return (
    <Pressable disabled={muted} style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      <View style={[styles.actionPill, muted && styles.actionPillMuted]}>
        <Text style={[styles.actionText, muted && styles.actionTextMuted]}>{action}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(0,0,0,0.58)', flex: 1, justifyContent: 'flex-end' },
  backdrop: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  card: { backgroundColor: '#101010', borderColor: '#343434', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, minHeight: 300, padding: 18 },
  grabber: { alignSelf: 'center', backgroundColor: '#4B4B4B', borderRadius: 999, height: 3, marginBottom: 18, width: 36 },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  title: { color: '#F0EDE9', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#737373', fontSize: 10.5, lineHeight: 15, marginTop: 4, maxWidth: 280 },
  close: { color: '#A3A3A3', fontSize: 24 },
  row: { alignItems: 'center', borderBottomColor: '#252525', borderBottomWidth: 1, flexDirection: 'row', gap: 12, minHeight: 68 },
  copy: { flex: 1, paddingRight: 8 },
  name: { color: '#EAE7E3', fontSize: 13, fontWeight: '700' },
  detail: { color: '#707070', fontSize: 10, lineHeight: 14, marginTop: 4 },
  actionPill: { borderColor: '#464646', borderRadius: 999, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 6 },
  actionPillMuted: { borderColor: '#2A2A2A' },
  actionText: { color: '#E4E1DD', fontSize: 9.5, fontWeight: '800' },
  actionTextMuted: { color: '#666' },
  sourceNote: { color: '#707070', fontSize: 10, lineHeight: 15, marginTop: 14 },
  helper: { color: '#8A8A8A', fontSize: 12, lineHeight: 18 },
  priorityRow: { alignItems: 'center', borderBottomColor: '#252525', borderBottomWidth: 1, flexDirection: 'row', minHeight: 52 },
  index: { color: '#666', fontSize: 10, width: 28 },
  priorityName: { color: '#E7E4E0', flex: 1, fontSize: 13, fontWeight: '700' },
  drag: { color: '#777', fontSize: 18 },
});
