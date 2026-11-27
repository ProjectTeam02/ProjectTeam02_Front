/** Figma 21-01~21-07 전용 UI. 공통 버튼/색상과 실제 서버 데이터를 사용합니다. */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import LerenButton from '../common/LerenButton';
import { ApiStatus } from '../ui/ApiStatus';
import { Notice } from '../ui/Primitives';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import type { ApiResource } from '../../hooks/useBackend';
import type { CalendarDay, CalendarPlan } from '../../services/calendarApi';
import type { Stage, Topic } from '../../services/learningApi';
import type { CalendarTarget } from '../../services/calendarTargets';
import { dateLabel, durationLabel, monthCells, moveMonth, seoulTime, two, type CalendarMark } from '../../services/calendarUtils';

export type Draft = { id: string | null; date: string; goal: string; planType: 'NEW_LEARNING' | 'REVIEW'; topicId: string | null; target: CalendarTarget | null };
const C = COLORS;
const BLUE = C.primary;
export const Panel = ({ children }: { children: ReactNode }) => <View style={s.panel}>{children}</View>;
const Label = ({ children }: { children: ReactNode }) => <Text style={s.label}>{children}</Text>;
const Hint = ({ children }: { children: ReactNode }) => <Text style={s.hint}>{children}</Text>;
export function CalendarStats({ left, leftLabel, right, rightLabel }: {left:string;leftLabel:string;right:string;rightLabel:string}) {
  return <View style={[s.panel,s.stats]}>{[[left,leftLabel],[right,rightLabel]].map(([value,label],i)=><View key={i} style={[s.stat,i===1&&s.statRight]}><Text style={s.statValue}>{value}</Text><Hint>{label}</Hint></View>)}</View>;
}
export function MonthlyCalendar({month,date,days=[],onMonth,onDate,picker=false}:{month:string;date:string;days?:CalendarMark[];onMonth:(m:string)=>void;onDate:(d:string)=>void;picker?:boolean}) {
  const [year,m] = month.split('-').map(Number);
  return <View style={[s.panel,s.calendar]}>
    <View style={s.monthHead}><Text style={s.monthTitle}>{year}년 {m}월</Text><View style={s.arrows}>{[-1,1].map(delta=><Pressable key={delta} accessibilityRole="button" accessibilityLabel={delta<0?'이전 달':'다음 달'} onPress={()=>onMonth(moveMonth(month,delta))} style={s.arrow}><Text style={s.arrowText}>{delta<0?'‹':'›'}</Text></Pressable>)}</View></View>
    <View style={s.grid}>{['월','화','수','목','금','토','일'].map(v=><View key={v} style={s.cell}><Text style={s.week}>{v}</Text></View>)}
      {monthCells(month).map((d,i)=>{const key=`${month}-${two(d??1)}`, mark=days.find(x=>x.date===key), completed=!!mark?.hasCompletedLearning, planned=!!mark?.hasScheduledLearning, selected=date===key;
        return <View key={i} style={s.cell}>{d!==null&&<Pressable accessibilityRole="button" accessibilityLabel={`${dateLabel(key)}${completed?' 학습 완료':''}${planned?' 학습 예정':''}`} accessibilityState={{selected}} onPress={()=>onDate(key)} style={[s.date,completed&&s.completed,planned&&s.planned,selected&&s.selected]}><Text style={[s.dateText,(completed||planned||selected)&&s.dateActive]}>{d}</Text>{!picker&&<View style={s.dots}>{completed&&<View style={[s.dot,s.dotFilled]}/>}{planned&&<View style={s.dot}/>}</View>}</Pressable>}</View>;
      })}
    </View>
    {!picker&&<View style={s.legend}><View style={[s.dot,s.dotFilled]}/><Hint>학습 완료</Hint><View style={[s.dot,{marginLeft:8}]}/><Hint>학습 예정</Hint></View>}
  </View>;
}
export function CalendarEmpty({onAdd}:{onAdd:()=>void}) {return <><Panel><Label>아직 학습 기록이 없어요</Label><Hint>첫 학습을 마치면 달력에 기록이 남아요. 오늘부터 작은 학습 습관을 만들어 봐요.</Hint></Panel><LerenButton title="첫 학습 시작하기" onPress={()=>router.push('/explore')}/><LerenButton title="학습 일정 먼저 정하기" variant="secondary" onPress={onAdd}/></>;}
export function CalendarSummaryCard({title,description,onPress}:{title:string;description:string;onPress:()=>void}) {return <Pressable accessibilityRole="button" onPress={onPress} style={[s.panel,s.summary]}><View style={s.flex}><Label>{title}</Label><Hint>{description}</Hint></View><Text style={s.chevron}>›</Text></Pressable>;}
export function DaySummary({day,onDetail,onEdit}:{day:CalendarDay;onDetail:()=>void;onEdit:(p:CalendarPlan)=>void}) {const first=day.learningRecords[0];return <>{first&&<CalendarSummaryCard title={`${dateLabel(day.date)} · 학습 기록`} description={[first.topic?.title,first.stage?.title].filter(Boolean).join(' · ')+(day.learningRecords.length>1?` 외 ${day.learningRecords.length-1}개`:'')} onPress={onDetail}/>}{day.schedules.map(p=><CalendarSummaryCard key={p.planId} title={`${dateLabel(p.scheduledDate)} · 예정 학습`} description={[p.stage?.title??p.concept?.title??p.topic?.title,p.goal].filter(Boolean).join(' · ')} onPress={()=>onEdit(p)}/>)}</>;}
export function CalendarDayDetail({day,onBack}:{day:CalendarDay;onBack:()=>void}) {
  const count=day.learningRecords.reduce((n,r)=>n+r.submittedCount,0);
  return <>{day.learningRecords.length>0&&<View style={[s.panel,s.successPanel]}><View style={s.flex}><Text style={s.monthTitle}>오늘도 한 단계 성장했어요</Text><Hint>완료한 학습 {day.learningRecords.length}개 · 퀴즈 {count}문제</Hint></View><View style={s.check}><Text style={s.chevron}>✓</Text></View></View>}
  {day.learningRecords.map(r=><View key={`${r.recordType}-${r.recordId}`} style={s.group}>
    <Panel><Label>{[r.topic?.title,r.stage?.title].filter(Boolean).join(' · ')||'학습 기록'}</Label><Text style={s.body}>학습 완료 {seoulTime(r.completedAt??r.endedAt)}</Text><Text style={s.body}>퀴즈 {r.submittedCount}문제 중 {r.correctCount}개 정답</Text></Panel>
    <CalendarStats left={r.accuracyPercentage===null?'기록 없음':`${Math.round(r.accuracyPercentage)}%`} leftLabel="정답률" right={durationLabel(r.elapsedSeconds)} rightLabel="학습 시간"/>
    <CalendarSummaryCard title="학습 내용 다시 보기" description="저장된 학습 문항 및 해설" onPress={()=>router.push({pathname:'/learning-detail',params:{recordType:r.recordType,recordId:r.recordId}})}/>
    {r.stage&&<CalendarSummaryCard title="개념 다시 학습하기" description={r.stage.title} onPress={()=>router.push({pathname:'/lesson',params:{stageId:r.stage!.stageId}})}/>}
  </View>)}
  {day.learningRecords.some(r=>r.submittedCount>r.correctCount)&&<CalendarSummaryCard title="오답 다시 풀기" description="전체 오답 복습 노트" onPress={()=>router.push({pathname:'/review',params:{filter:'WRONG'}})}/>}
  {day.learningRecords.length===0&&<Panel><Hint>해당 날짜에 완료한 학습 기록이 없어요.</Hint></Panel>}
  <LerenButton title="달력으로 돌아가기" variant="secondary" onPress={onBack}/></>;
}
function FieldButton({label,value,onPress,disabled}:{label:string;value:string;onPress:()=>void;disabled:boolean}) {return <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} disabled={disabled} onPress={onPress} style={s.input}><Text style={[s.body,s.flex]}>{value}</Text><Text style={s.chevron}>⌄</Text></Pressable>;}
export function CalendarPlanForm({draft,topics,stages,busy,error,onChange,onTopic,onStage,onSave,onCancel,onDelete}:{draft:Draft;topics:ApiResource<{items:Topic[]}>;stages:ApiResource<{topic:Topic;items:Stage[]}>;busy:boolean;error:string;onChange:(d:Draft)=>void;onTopic:(id:string)=>void;onStage:(id:string)=>void;onSave:()=>void;onCancel:()=>void;onDelete:()=>void}) {
  const [picker,setPicker]=useState<'date'|'target'|null>(null),[pickerMonth,setPickerMonth]=useState(draft.date.slice(0,7));
  const close=()=>setPicker(null);
  return <>
    <Label>학습 날짜</Label><FieldButton label="학습 날짜" value={draft.date.replace(/-/g,'.')} disabled={busy} onPress={()=>{setPickerMonth(draft.date.slice(0,7));setPicker('date');}}/><Hint>공부할 날짜를 선택해 주세요</Hint>
    <Label>학습 주제</Label><FieldButton label="학습 주제" value={draft.target?.label??'학습 주제와 단계 선택'} disabled={busy} onPress={()=>setPicker('target')}/><Hint>학습할 단계를 선택해 주세요</Hint>
    <View style={s.typeRow}>{(['NEW_LEARNING','REVIEW'] as const).map(t=><Pressable key={t} accessibilityRole="button" accessibilityState={{selected:draft.planType===t}} disabled={busy} onPress={()=>onChange({...draft,planType:t})} style={[s.typeButton,draft.planType===t&&s.typeActive]}><Text style={[s.typeText,draft.planType===t&&s.typeActiveText]}>{t==='REVIEW'?'복습':'새 학습'}</Text></Pressable>)}</View>
    <Label>나의 목표</Label><TextInput accessibilityLabel="나의 목표" value={draft.goal} onChangeText={goal=>onChange({...draft,goal})} editable={!busy} placeholder="학습 목표를 입력해 주세요" placeholderTextColor={C.muted} style={[s.input,s.goal]}/><Hint>필수 사항 · 1~30자 ({[...draft.goal.trim()].length}/30)</Hint>
    {!!error&&<Notice tone="error">{error}</Notice>}
    <LerenButton title={draft.id?'변경 내용 저장':'일정 저장'} disabled={busy||!draft.target} loading={busy} onPress={onSave}/>
    <LerenButton title={draft.id?'일정 삭제':'취소'} variant="secondary" disabled={busy} onPress={draft.id?onDelete:onCancel}/>
    <Modal transparent visible={picker!==null} animationType="fade" onRequestClose={close}><View style={s.overlay}><View style={s.modal}>
      <Text style={s.monthTitle}>{picker==='date'?'학습 날짜 선택':'학습 주제 및 단계 선택'}</Text>
      {picker==='date'?<MonthlyCalendar picker month={pickerMonth} date={draft.date} onMonth={setPickerMonth} onDate={date=>{onChange({...draft,date});close();}}/>:<ScrollView style={s.options} keyboardShouldPersistTaps="handled"><Label>학습 주제</Label><ApiStatus resource={topics} label="학습 주제"/>{topics.data?.items.length===0&&<Hint>공개된 학습 주제가 없어요.</Hint>}{topics.data?.items.map(t=><Pressable key={t.topicId} accessibilityRole="button" accessibilityState={{selected:draft.topicId===t.topicId}} onPress={()=>onTopic(t.topicId)} style={[s.option,draft.topicId===t.topicId&&s.typeActive]}><Text style={s.body}>{t.title}</Text></Pressable>)}
      {!!draft.topicId&&<><Label>학습 단계</Label><ApiStatus resource={stages} label="학습 단계"/>{stages.data?.items.length===0&&<Hint>공개된 학습 단계가 없어요.</Hint>}{stages.data?.items.map(stage=><Pressable key={stage.stageId} accessibilityRole="button" accessibilityState={{selected:draft.target?.stageId===stage.stageId}} style={[s.option,draft.target?.stageId===stage.stageId&&s.typeActive]} onPress={()=>{onStage(stage.stageId);close();}}><Text style={s.body}>{stage.title}{stage.stageType==='BOSS'?' · BOSS':''}</Text></Pressable>)}</>}</ScrollView>}
      <LerenButton title="닫기" variant="secondary" onPress={close}/>
    </View></View></Modal>
  </>;
}
export function CalendarDeleteDialog({visible,busy,error,onConfirm,onCancel}:{visible:boolean;busy:boolean;error:string;onConfirm:()=>void;onCancel:()=>void}) {return <Modal transparent visible={visible} animationType="fade" onRequestClose={()=>{if(!busy)onCancel();}}><View style={s.overlay}><View style={s.modal}><Text style={s.monthTitle}>이 일정을 삭제할까요?</Text><Hint>예정된 일정만 삭제돼요. 이미 완료한 학습 기록은 남아 있어요.</Hint>{!!error&&<Notice tone="error">{error}</Notice>}<LerenButton title="일정 삭제" loading={busy} disabled={busy} onPress={onConfirm}/><LerenButton title="유지하기" variant="secondary" disabled={busy} onPress={onCancel}/></View></View></Modal>;}
const s=StyleSheet.create({
  flex:{flex:1,gap:4},group:{gap:10},panel:{borderWidth:1,borderColor:C.line,borderRadius:14,backgroundColor:C.surface,padding:14,gap:7},stats:{flexDirection:'row',alignItems:'center',paddingVertical:12},stat:{flex:1,alignItems:'center',gap:2,paddingHorizontal:5},statRight:{borderLeftWidth:1,borderColor:C.line},statValue:{...TYPOGRAPHY.heading,color:BLUE,textAlign:'center'},label:{...TYPOGRAPHY.label,color:C.ink},hint:{...TYPOGRAPHY.micro,color:C.muted},body:{...TYPOGRAPHY.small,color:C.ink},calendar:{padding:10,gap:8},monthHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},monthTitle:{...TYPOGRAPHY.heading,color:C.ink},arrows:{flexDirection:'row'},arrow:{minWidth:36,minHeight:44,alignItems:'center',justifyContent:'center'},arrowText:{fontSize:24,color:BLUE},grid:{flexDirection:'row',flexWrap:'wrap'},cell:{width:'14.285714%',alignItems:'center',justifyContent:'center',paddingVertical:2},week:{...TYPOGRAPHY.micro,color:C.muted},date:{width:'94%',minHeight:44,alignItems:'center',justifyContent:'center',borderRadius:9,borderWidth:1,borderColor:'transparent',gap:3},dateText:{...TYPOGRAPHY.small,color:C.ink},dateActive:{color:BLUE,fontWeight:'700'},completed:{backgroundColor:C.soft},planned:{borderColor:C.line},selected:{borderColor:BLUE,borderWidth:1.5},dots:{minHeight:8,flexDirection:'row',gap:4,alignItems:'center'},dot:{width:7,height:7,borderRadius:4,borderWidth:1,borderColor:BLUE,backgroundColor:C.surface},dotFilled:{backgroundColor:BLUE},legend:{flexDirection:'row',alignItems:'center',gap:5,flexWrap:'wrap'},summary:{flexDirection:'row',alignItems:'center'},chevron:{fontSize:20,color:BLUE},successPanel:{backgroundColor:C.soft,borderColor:C.soft,flexDirection:'row',alignItems:'center'},check:{width:36,height:36,borderRadius:18,backgroundColor:C.surface,alignItems:'center',justifyContent:'center'},input:{borderWidth:1,borderColor:C.line,borderRadius:10,minHeight:50,paddingHorizontal:13,paddingVertical:10,flexDirection:'row',alignItems:'center',backgroundColor:C.surface},goal:{...TYPOGRAPHY.body,color:C.ink},typeRow:{flexDirection:'row',gap:8},typeButton:{flex:1,minHeight:44,borderWidth:1,borderColor:C.line,borderRadius:10,alignItems:'center',justifyContent:'center'},typeActive:{backgroundColor:C.soft,borderColor:C.soft},typeText:{...TYPOGRAPHY.small,color:C.muted},typeActiveText:{color:BLUE,fontWeight:'700'},overlay:{flex:1,backgroundColor:'rgba(24,40,66,0.40)',justifyContent:'center',alignItems:'center',padding:20},modal:{width:'100%',maxWidth:420,maxHeight:'90%',backgroundColor:C.surface,borderRadius:16,padding:18,gap:12},options:{flexGrow:0,maxHeight:360},option:{borderRadius:8,padding:12,marginVertical:3,borderWidth:1,borderColor:C.line}
});
