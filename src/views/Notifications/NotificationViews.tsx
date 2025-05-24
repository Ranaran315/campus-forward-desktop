// campus-forward-desktop/src/views/Notifications/NotificationPage.tsx
import { useState, useEffect, useCallback } from 'react'
import NotificationSidebar from './NotificationSidebar' // Corrected import path
import NotificationDetailDisplay from './NotificationDetail'
import NewNotification from './NoticeForm' // Import NewNotification
import MyPublishedNoticesView from './MyCreatedNoticeView' // Import MyPublishedNoticesView
import { NotificationDetail as NotificationDetailType } from '@/types/notifications.type'
import './NotificationViews.css'
import { Form, message } from 'antd' // Import Form and message from antd
import apiClient from '@/lib/axios' // Import apiClient
import { Route, Routes } from 'react-router-dom'
import NotificationEditView from './NotificationEditView'

function NotificationWelcome() {
  return (
    <>
      <div className="notification-welcome">
        <span>🔔</span>
        请选择一条通知以查看详情
      </div>
    </>
  )
}

function NotificationPage() {
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    string | null
  >(null)
  const [selectedNotificationDetail, setSelectedNotificationDetail] =
    useState<NotificationDetailType | null>(null)
  const [newForm] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock data, assuming it might still be used for details, or fetched based on ID
  const mockNotificationDetailsData: { [key: string]: NotificationDetailType } =
    {
      r1: {
        id: 'r1',
        title: '系统维护通知',
        contentFull:
          '尊敬的用户：\n\n为了提供更优质的服务，校园信息系统计划于2025年5月17日（星期六）凌晨1:00至3:00进行停机维护。\n维护期间，部分校园网服务（如教务系统、图书馆预约、一卡通充值等）可能会出现短暂中断。\n\n请您提前安排好相关事宜，由此给您带来的不便，敬请谅解。\n\n感谢您的理解与支持！\n\n信息化建设与管理处',
        timestamp: '2025-05-17 10:00',
        type: '系统通知',
        sender: {
          id: 'admin',
          name: '系统管理员',
          avatar: '/assets/avatars/admin.png',
        },
      },
      r2: {
        id: 'r2',
        title: '新课程开放选课',
        contentFull:
          '各位同学：\n\n本学期新开设课程“CS550: 高级人工智能”现已正式开放选课。\n\n课程名额有限，请有意向的同学尽快登录学生门户网站进行选课操作。\n选课截止日期：2025年5月20日\n\n先修课程要求：CS300 (数据结构与算法), MATH210 (概率论与数理统计)。\n\n教务处',
        timestamp: '2025-05-16 14:30',
        type: '教务通知',
        sender: { id: 'registrar', name: '教务处' },
      },
      r3: {
        id: 'r3',
        title: '您的每周校园资讯',
        contentFull:
          '您好！\n\n以下是本周的校园资讯摘要：\n- 图书馆期末考试周延长开放时间通知。\n- 著名学者李明教授将来我校举办讲座，主题：“量子计算的未来展望”，时间：5月20日下午2点，地点：学术报告厅。\n- 年度校园运动会报名通道已开启，欢迎踊跃参与。\n\n祝您学习愉快！\n\n校园新闻中心',
        timestamp: '2025-05-15 09:15',
        type: '校园资讯',
        sender: { id: 'newsletter', name: '校园新闻中心' },
      },
      r4: {
        id: 'r4',
        title: '图书馆座位预约成功',
        contentFull:
          '同学您好，\n\n您已成功预约图书馆座位。\n预约详情：\n日期：2025年5月18日\n时间：全天\n区域：三楼A区\n座位号：01\n\n请按时前往，并在入馆时出示此通知。如需取消，请提前2小时操作。\n\n图书馆管理系统',
        timestamp: '2025-05-17 11:00',
        type: '预约提醒',
        sender: { id: 'library-system', name: '图书馆系统' },
      },
      s1: {
        id: 's1',
        title: '关于项目提案提交的提醒',
        contentFull:
          '各位同学：\n\n温馨提醒，本课程（CS401）的项目提案提交截止日期为本周五（5月21日）晚上11:59。\n请务必通过课程在线平台准时提交。\n\n预祝项目顺利！\n\n张老师',
        timestamp: '2025-05-15 17:00',
        sentBy: '您 (张老师)',
        recipients: [{ id: 'cs401group', name: '计算机科学401班全体同学' }],
      },
      s2: {
        id: 's2',
        title: '食堂新菜单意见征集',
        contentFull:
          '亲爱的老师同学们：\n\n近期，学校食堂对菜单进行了调整和更新，为了更好地满足大家的口味需求，我们特此发起意见征集活动。\n欢迎大家积极反馈，您可以通过以下链接填写问卷：[问卷链接]\n\n您的宝贵意见将是我们改进工作的重要参考！\n\n后勤服务集团餐饮中心',
        timestamp: '2025-05-14 11:20',
        sentBy: '您 (后勤集团)',
        recipients: [{ id: 'allcampus', name: '全体在校师生' }],
      },
      // Add more details for static notifications from NotificationsSidebar if needed
      '1': {
        id: '1',
        title: '五一劳动节放假通知',
        contentFull:
          '根据国家法定节假日安排，结合我校实际情况，现将2025年五一劳动节放假安排通知如下：\n\n放假时间：5月1日至5月5日，共5天。4月26日（星期六）、5月10日（星期六）上班。\n\n请各部门、学院提前做好工作安排，确保假期期间校园安全稳定。\n祝全体师生员工节日快乐！\n\n校长办公室\n2025年4月28日',
        timestamp: '2025-04-28',
        type: '节假通知',
        sentBy: '校长办公室',
      },
      '2': {
        id: '2',
        title: '关于开展校园安全大检查的通知',
        contentFull:
          '为进一步加强校园安全管理，消除安全隐患，确保师生人身财产安全，学校决定于近期在全校范围内开展一次全面的安全大检查。\n\n检查内容包括：消防安全、实验室安全、宿舍安全、食品安全等。\n请各单位高度重视，认真组织自查自纠，并将自查报告于5月15日前报送至保卫处。\n\n保卫处\n2025年5月10日',
        timestamp: '2025-05-10',
        type: '安全通知',
        sentBy: '保卫处',
      },
      '3': {
        id: '3',
        title: '图书馆闭馆通知',
        contentFull:
          '各位读者：\n\n因内部系统升级维护，图书馆将于2025年5月19日（星期一）闭馆一天。\n由此给您带来的不便，敬请谅解。\n\n图书馆\n2025年5月15日',
        timestamp: '2025-05-15',
        type: '服务通知',
        sentBy: '图书馆',
      },
      '4': {
        id: '4',
        title: '学术讲座邀请：AI与未来教育',
        contentFull:
          '主题：人工智能在未来教育中的机遇与挑战\n主讲人：李明 教授（XX大学人工智能学院院长）\n时间：2025年5月22日（星期四）下午2:30\n地点：学术报告厅A101\n\n欢迎全校师生踊跃参加！\n\n科研处\n2025年5月20日',
        timestamp: '2025-05-20',
        type: '学术活动',
        sentBy: '科研处',
      },
    }

  useEffect(() => {
    if (
      selectedNotificationId &&
      mockNotificationDetailsData[selectedNotificationId]
    ) {
      setSelectedNotificationDetail(
        mockNotificationDetailsData[selectedNotificationId]
      )
    } else {
      setSelectedNotificationDetail(null)
    }
  }, [selectedNotificationId])

  const handleSelectNotification = useCallback((id: string) => {
    setSelectedNotificationId(id)
  }, [])

  const handleCancelPublish = () => {
    newForm.resetFields()
  }

  const handlePublishNoticeSubmit = async (values: any) => {
    setIsSubmitting(true)
    console.log('Publishing notice with values:', values)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      message.success('通知发布成功!')
      handleCancelPublish()
    } catch (error) {
      console.error('Failed to publish notice:', error)
      message.error('通知发布失败，请稍后再试。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="notification-page-container">
      <NotificationSidebar
        selectedNotificationId={selectedNotificationId}
        onNotificationSelect={handleSelectNotification}
      />
      <main className="notification-detail-view">
        <Routes>
          <Route index element={<NotificationWelcome />} />
          <Route
            path="new"
            element={
              <NewNotification
                formInstance={newForm}
                onCancel={handleCancelPublish}
                onPublish={handlePublishNoticeSubmit}
                isSubmitting={isSubmitting}
              />
            }
          />
          <Route path="my-created" element={<MyPublishedNoticesView />} />
          <Route path="edit/:id" element={<NotificationEditView />} />
          {/* <Route path=":id" element={<NotificationDetailDisplay />} /> */}
          <Route path="*" element={<div>页面不存在</div>} />
        </Routes>
      </main>
    </div>
  )
}

export default NotificationPage
