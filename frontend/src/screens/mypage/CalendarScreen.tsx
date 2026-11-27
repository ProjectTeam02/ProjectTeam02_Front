/** Figma 21-01~21-07: 서울 기준 학습 달력과 실제 일정 CRUD. */
import { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import Screen from '../../components/ui/Screen';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenButton from '../../components/common/LerenButton';
import { CalendarStats, MonthlyCalendar, CalendarEmpty, CalendarDayDetail, CalendarPlanForm, CalendarDeleteDialog, DaySummary, Panel, type Draft } from '../../components/calendar/CalendarViews';
import { useBackend, useBackendAction } from '../../hooks/useBackend';
import { useLearningQuery } from '../../hooks/useLearningQuery';
import { PATHS, monthDecoder, planDecoder, deletedDecoder } from '../../services/backend';
import { calendarDayDecoder, type CalendarPlan } from '../../services/calendarApi';
import { LEARNING_PATHS, topicsDecoder, stagesDecoder } from '../../services/learningApi';
import { selectCalendarStage } from '../../services/calendarTargets';
import { dateLabel, goalValid, previewDates, seoulToday, validDate } from '../../services/calendarUtils';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

export default function CalendarScreen() {
  const [date,setDate]=useState(seoulToday);
  const [month,setMonth]=useState(()=>date.slice(0,7));
  const [detail,setDetail]=useState(false);
  const [draft,setDraft]=useState<Draft|null>(null);
  const [confirmDelete,setConfirmDelete]=useState(false);
  const [notice,setNotice]=useState<{title:string;description?:string}|null>(null);
  const [validation,setValidation]=useState('');
  const [attempted,setAttempted]=useState(false);
  const [originalDate,setOriginalDate]=useState<string|null>(null);
  const monthly=useLearningQuery(`${PATHS.calendar}?month=${month}`,monthDecoder);
  const daily=useLearningQuery(`${PATHS.calendar}/days/${date}`,calendarDayDecoder);
  const [firstPreview,secondPreview]=previewDates(monthly.data?.days??[],date,seoulToday());
  const preview1=useLearningQuery(firstPreview?`${PATHS.calendar}/days/${firstPreview}`:null,calendarDayDecoder);
  const preview2=useLearningQuery(secondPreview?`${PATHS.calendar}/days/${secondPreview}`:null,calendarDayDecoder);
  const topics=useBackend(draft?LEARNING_PATHS.topics:null,topicsDecoder);
  const stages=useBackend(draft?.topicId?LEARNING_PATHS.stages(draft.topicId):null,stagesDecoder);
  const action=useBackendAction();
  const refresh=()=>{monthly.reload();daily.reload();preview1.reload();preview2.reload();};
  const clearErrors=()=>{setValidation('');setAttempted(false);};
  const changeDate=(d:string)=>{setDate(d);setMonth(d.slice(0,7));setNotice(null);clearErrors();};
  const openDetail=(d:string)=>{changeDate(d);setDetail(true);};
  const edit=(p?:CalendarPlan)=>{
    setNotice(null);clearErrors();setConfirmDelete(false);
    const target=p?.topic&&(p.stageId||p.conceptId)?{topicId:p.topic.topicId,stageId:p.stageId,conceptId:p.conceptId,label:[p.topic.title,p.stage?.title??p.concept?.title].filter(Boolean).join(' · ')}:null;
    setDraft({id:p?.planId??null,date:p?.scheduledDate??date,goal:p?.goal??'',planType:p?.planType==='REVIEW'?'REVIEW':'NEW_LEARNING',topicId:target?.topicId??null,target});
  };
  const updateDraft=(d:Draft)=>{if(!action.busy){setDraft(d);clearErrors();}};
  const chooseTopic=(id:string)=>{if(draft&&!action.busy&&draft.topicId!==id)updateDraft({...draft,topicId:id,target:null});};
  const chooseStage=(id:string)=>{
    if(!draft?.topicId||action.busy)return;
    const target=selectCalendarStage(draft.topicId,id,stages.data);
    if(target)updateDraft({...draft,target:{...target,label:`${stages.data!.topic.title} · ${target.label}`}});
  };
  const cancel=()=>{if(!action.busy){setDraft(null);setConfirmDelete(false);clearErrors();}};
  const save=async()=>{
    if(!draft||action.busy)return;
    clearErrors();
    if(!validDate(draft.date)){setValidation('유효한 학습 날짜를 선택해 주세요.');return;}
    if(!goalValid(draft.goal)){setValidation('나의 목표는 1~30자로 입력해 주세요.');return;}
    const target=draft.target;
    if(!target||target.topicId!==draft.topicId||(!target.stageId&&!target.conceptId)){setValidation('학습 주제와 단계를 선택해 주세요.');return;}
    setAttempted(true);
    const result=await action.run(draft.id?`${PATHS.plans}/${encodeURIComponent(draft.id)}`:PATHS.plans,planDecoder,draft.id?'PATCH':'POST',{scheduledDate:draft.date,goal:draft.goal.trim(),planType:draft.planType,topicId:target.topicId,stageId:target.stageId,conceptId:target.conceptId});
    if(result){changeDate(result.scheduledDate);setDraft(null);setDetail(false);refresh();setNotice({title:`${dateLabel(result.scheduledDate)} 일정을 저장했어요.`});}
  };
  const remove=async()=>{
    if(!draft?.id||action.busy)return;
    setAttempted(true);setValidation('');
    const result=await action.run(`${PATHS.plans}/${encodeURIComponent(draft.id)}`,deletedDecoder,'DELETE');
    if(result){const deletedDate=draft.date;/* 수정 중 날짜를 바꿔도 삭제 대상은 기존 일정 날짜입니다. */
      changeDate(originalDate??deletedDate);setDraft(null);setConfirmDelete(false);setDetail(false);refresh();setNotice({title:`${dateLabel(originalDate??deletedDate)} 일정을 삭제했어요.`,description:'완료한 학습 기록은 그대로 남아 있어요.'});}
  };
  // 편집 도중 날짜를 바꾸더라도 삭제 안내는 저장된 원래 날짜를 사용합니다.
  const openForm=(p?:CalendarPlan)=>{setOriginalDate(p?.scheduledDate??null);edit(p);};
  const error=validation||(attempted?action.error:'');
  if(draft)return <Screen title={draft.id?'학습 일정 수정':'학습 일정 추가'} tabs onBack={cancel}>
    <CalendarPlanForm key={draft.id??'new'} draft={draft} topics={topics} stages={stages} busy={action.busy} error={confirmDelete?'':error} onChange={updateDraft} onTopic={chooseTopic} onStage={chooseStage} onSave={()=>void save()} onCancel={cancel} onDelete={()=>{clearErrors();setConfirmDelete(true);}}/>
    <CalendarDeleteDialog visible={confirmDelete} busy={action.busy} error={error} onConfirm={()=>void remove()} onCancel={()=>{if(!action.busy){setConfirmDelete(false);clearErrors();}}}/>
  </Screen>;
  if(detail)return <Screen title={`${dateLabel(date)}의 학습`} tabs onBack={()=>setDetail(false)}>
    <ApiStatus resource={daily} label="날짜별 학습 기록"/>
    {daily.data?<CalendarDayDetail day={daily.data} onBack={()=>setDetail(false)}/>:<LerenButton title="달력으로 돌아가기" variant="secondary" onPress={()=>setDetail(false)}/>}
  </Screen>;
  const empty=monthly.status==='success'&&!!monthly.data&&monthly.data.days.every(d=>d.completedCount===0&&d.scheduledCount===0);
  return <Screen title="학습 달력" tabs>
    <ApiStatus resource={monthly} label="월별 달력"/>
    {monthly.data&&!empty&&<CalendarStats left={`${monthly.data.completedDayCount}일`} leftLabel="이번 달 학습" right={`${monthly.data.streakDays}일`} rightLabel="연속 학습"/>}
    <MonthlyCalendar month={month} date={date} days={monthly.data?.days} onMonth={m=>{if(m!==month)changeDate(`${m}-01`);}} onDate={changeDate}/>
    {notice&&<Panel><Text style={s.title}>{notice.title}</Text>{notice.description&&<Text style={s.body}>{notice.description}</Text>}</Panel>}
    <ApiStatus resource={daily} label="날짜별 기록"/>
    {empty&&daily.status==='success'&&daily.data&&daily.data.learningRecords.length===0&&daily.data.schedules.length===0?<CalendarEmpty onAdd={()=>openForm()}/>:<>
      {daily.data&&<DaySummary day={daily.data} onDetail={()=>openDetail(date)} onEdit={openForm}/>}
      {daily.data&&daily.data.learningRecords.length===0&&daily.data.schedules.length===0&&<Text style={s.body}>{dateLabel(date)}에는 학습 기록이나 예정 일정이 없어요.</Text>}
      {firstPreview&&<><ApiStatus resource={preview1} label={`${dateLabel(firstPreview)} 기록`}/>{preview1.data&&<DaySummary day={preview1.data} onDetail={()=>openDetail(firstPreview)} onEdit={openForm}/>}</>}
      {secondPreview&&<><ApiStatus resource={preview2} label={`${dateLabel(secondPreview)} 기록`}/>{preview2.data&&<DaySummary day={preview2.data} onDetail={()=>openDetail(secondPreview)} onEdit={openForm}/>}</>}
      <LerenButton title="학습 일정 추가" onPress={()=>openForm()}/>
    </>}
  </Screen>;
}
const s=StyleSheet.create({title:{...TYPOGRAPHY.label,color:COLORS.ink},body:{...TYPOGRAPHY.small,color:COLORS.muted}});
