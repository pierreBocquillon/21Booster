import Notif from "@/classes/Notif.js"

let notifManager = {
  async sendCashNotif(userId, amount, reason) {
    let notif = Notif.initOne(userId)
    notif.type = "CASH"
    notif.data = {
      amount: amount,
      reason: reason
    }
    await notif.save()
  },
  async sendCardNotif(userId, cards, reason) {
    let notif = Notif.initOne(userId)
    notif.type = "CARD"
    notif.data = {
      cards: cards,
      reason: reason
    }
    await notif.save()
  },
  async sendBoosterNotif(userId, boosters, reason) {
    let notif = Notif.initOne(userId)
    notif.type = "BOOSTER"
    notif.data = {
      boosters: boosters,
      reason: reason
    }
    await notif.save()
  },
  async sendAchievementNotif(userId, achievementId, reason) {
    let notif = Notif.initOne(userId)
    notif.type = "ACHIEVEMENT"
    notif.data = {
      achievement: achievementId,
      reason: reason
    }
    await notif.save()
  }
}

export default notifManager
