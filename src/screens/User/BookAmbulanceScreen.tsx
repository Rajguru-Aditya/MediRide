import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const BookAmbulanceScreen = ({ user, navigation }: any) => {
  return (
    <View>
      <Text>BookAmbulanceScreen</Text>
      <Text>{user.name}</Text>
      <Text>{user.email}</Text>
      <Text>{user.phone}</Text>
      <Text>{user.address}</Text>
      <Text>{user.city}</Text>
      <Text>{user.state}</Text>
      <Text>{user.zip}</Text>
      <Text>{user.country}</Text>
      <Text>{user.role}</Text>
      <Text>{user.uid}</Text>
      <Text>{user.createdAt}</Text>
      <Text>{user.updatedAt}</Text>
      <Text>{user.isActive}</Text>
      <Text>{user.isVerified}</Text>
      <Text>{user.isAdmin}</Text>
      <Text>{user.isDriver}</Text>
      <Text>{user.isUser}</Text>
      <Text>{user.isAmbulance}</Text>
      <Text>{user.isHospital}</Text>
      <Text>{user.isAmbulance}</Text>
      <Text>{user.isAmbulance}</Text>
      <Text>{user.isAmbulance}</Text>
      <Text>{user.isAmbulance}</Text>
    </View>
  )
}

export default BookAmbulanceScreen

const styles = StyleSheet.create({})