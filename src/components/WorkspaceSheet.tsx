import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { supabaseConfigured } from '@/lib/supabaseRest';

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
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose}><Text style={styles.close}>×</Text></Pressable>
          </View>
          {page === 'sources' && (
            <>
              <Row name="Supabase" detail="Project backend" state={supabaseConfigured ? 'Configured' : 'Key required'} />
              <Row name="Outlook" detail="Calendar sync" state="Planned" />
              <Row name="Teams" detail="Meeting context" state="Planned" />
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

function Row({ name, detail, state }: { name: string; detail: string; state: string }) {
  return <View style={styles.row}><View style={styles.copy}><Text style={styles.name}>{name}</Text><Text style={styles.detail}>{detail}</Text></View><Text style={styles.state}>{state}</Text></View>;
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(0,0,0,0.58)', flex: 1, justifyContent: 'flex-end' },
  backdrop: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  card: { backgroundColor: '#101010', borderColor: '#343434', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, minHeight: 260, padding: 18 },
  grabber: { alignSelf: 'center', backgroundColor: '#4B4B4B', borderRadius: 999, height: 3, marginBottom: 18, width: 36 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  title: { color: '#F0EDE9', fontSize: 18, fontWeight: '800' },
  close: { color: '#A3A3A3', fontSize: 24 },
  row: { alignItems: 'center', borderBottomColor: '#252525', borderBottomWidth: 1, flexDirection: 'row', minHeight: 62 },
  copy: { flex: 1 },
  name: { color: '#EAE7E3', fontSize: 13, fontWeight: '700' },
  detail: { color: '#707070', fontSize: 10, marginTop: 4 },
  state: { color: '#9C9C9C', fontSize: 10, fontWeight: '700' },
  helper: { color: '#8A8A8A', fontSize: 12, lineHeight: 18 },
  priorityRow: { alignItems: 'center', borderBottomColor: '#252525', borderBottomWidth: 1, flexDirection: 'row', minHeight: 52 },
  index: { color: '#666', fontSize: 10, width: 28 },
  priorityName: { color: '#E7E4E0', flex: 1, fontSize: 13, fontWeight: '700' },
  drag: { color: '#777', fontSize: 18 },
});
