import React from "react";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <Icon sf="house.fill" />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(memories)">
        <Icon sf="photo.fill" />
        <Label>Memories</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(connect)">
        <Icon sf="heart.fill" />
        <Label>Connect</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(goals)">
        <Icon sf="checkmark.circle.fill" />
        <Label>Goals</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(journal)">
        <Icon sf="book.fill" />
        <Label>Journal</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
