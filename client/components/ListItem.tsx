import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import SongItem from './SongItem';

interface ListItemProps {
    song: {
        rating: number;
        track: {
            id: string;
            name: string;
            artists: Array<{ name: string }>;
            album: { images: Array<{ url: string }> };
            duration_ms: number;
        };
    };
    handleDeleteItem: (songId: string) => void;
}

const ListItem: React.FC<ListItemProps> = ({ song, handleDeleteItem }) => {
    const { track, rating } = song;

    return (
        <View style={styles.container}>
            <View style={styles.songItemContainer}>
                <SongItem
                    title={track.name}
                    artist={track.artists.map(artist => artist.name).join(', ')}
                    albumCover={track.album.images[0]?.url || ''}
                    duration={track.duration_ms}
                />
            </View>
            <View style={styles.actionsContainer}>
                <View style={styles.divider} />
                <Text style={styles.rating}>{rating.toFixed(1)}</Text>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteItem(track.id)}>
                    <MaterialIcons name="delete" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    songItemContainer: {
        flex: 0.7,  // Allocates 70% of the space to the SongItem
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flex: 0.3,  // Allocates 30% of the space to rating and delete button
    },
    rating: {
        fontSize: 16,
        color: '#333',
        marginRight: 10,
    },
    divider: {
        width: 1,
        height: '80%',
        backgroundColor: '#ccc',
        marginHorizontal: 10,
    },
    deleteButton: {
        width: 30,
        height: 30,
        borderRadius: 18,
        backgroundColor: '#FF6347', // Tomato color for delete button
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ListItem;
