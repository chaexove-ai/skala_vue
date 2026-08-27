<script setup>
// 1~3일차 기초 실습 컴포넌트를 한 화면에 모아두는 목록.
// 과제 4에서 화면이 라우트로 나뉘면서, 원래 App.vue에 있던 나열을 이 컴포넌트로 옮겼다.
// (App.vue는 이제 내비게이션과 <RouterView />만 책임진다)
import SampleOne from '@/components/practices/basic/SampleOne.vue'
import SampleTwo from '@/components/practices/basic/SampleTwo.vue'
import VueHtml from '@/components/practices/basic/VueHtml.vue'
import VueHtmlXss from '@/components/practices/basic/VueHtmlXss.vue'
import VueText from '@/components/practices/basic/VueText.vue'
import VueBind from '@/components/practices/basic/VueBind.vue'
import VueBindClass from '@/components/practices/basic/VueBindClass.vue'
import VueBindStyle from '@/components/practices/basic/VueBindStyle.vue'
import VueBindShorthand from '@/components/practices/basic/VueBindShorthand.vue'
import VueIf from '@/components/practices/basic/VueIf.vue'
import VueShow from '@/components/practices/basic/VueShow.vue'
import VueFor from '@/components/practices/basic/VueFor.vue'
import VuePre from '@/components/practices/basic/VuePre.vue'
import VueCloak from '@/components/practices/basic/VueCloak.vue'
import VueOnce from '@/components/practices/basic/VueOnce.vue'
import VueMemo from '@/components/practices/basic/VueMemo.vue'
import EventBasic from '@/components/practices/basic/EventBasic.vue'
import EventObject from '@/components/practices/basic/EventObject.vue'
import EventModifier from '@/components/practices/basic/EventModifier.vue'
import ModelBasic from '@/components/practices/basic/ModelBasic.vue'
import ModelForm from '@/components/practices/basic/ModelForm.vue'
import ModelModifier from '@/components/practices/basic/ModelModifier.vue'
import StyleScoped from '@/components/practices/basic/StyleScoped.vue'
import ReactiveRef from '@/components/practices/composition/ReactiveRef.vue'
import ReactiveReactive from '@/components/practices/composition/ReactiveReactive.vue'
import ComputedBasic from '@/components/practices/composition/ComputedBasic.vue'
import WatchersBasic from '@/components/practices/composition/WatchersBasic.vue'
import WatchersMulti from '@/components/practices/composition/WatchersMulti.vue'
import WatchersDeep from '@/components/practices/composition/WatchersDeep.vue'
import WatchersReactive from '@/components/practices/composition/WatchersReactive.vue'
import WatchersWatchEffect from '@/components/practices/composition/WatchersWatchEffect.vue'
import LifecycleParent from '@/components/practices/component/LifecycleParent.vue'
import PropsEmitsParent from '@/components/practices/component/PropsEmitsParent.vue'
import SlotDefaultParent from '@/components/practices/component/SlotDefaultParent.vue'
import SlotNamedParent from '@/components/practices/component/SlotNamedParent.vue'
import SlotScopedParent from '@/components/practices/component/SlotScopedParent.vue'
import AxiosWeather from '@/components/practices/library/AxiosWeather.vue'
import AxiosJson from '@/components/practices/library/AxiosJson.vue'
import ElementPlus from '@/components/practices/library/ElementPlus.vue'
</script>

<template>
  <div>
    <SampleOne />
    <hr />
    <SampleTwo />
    <hr />
    <VueHtml />
    <hr />
    <VueHtmlXss />
    <hr />
    <VueText />
    <hr />
    <VueBind />
    <hr />
    <VueBindClass />
    <hr />
    <VueBindStyle />
    <hr />
    <VueBindShorthand />
    <hr />
    <VueIf />
    <hr />
    <VueShow />
    <hr />
    <VueFor />
    <hr />
    <VuePre />
    <hr />
    <VueCloak />
    <hr />
    <VueOnce />
    <hr />
    <VueMemo />
    <hr />
    <EventBasic />
    <hr />
    <EventObject />
    <hr />
    <EventModifier />
    <hr />
    <ModelBasic />
    <hr />
    <ModelForm />
    <hr />
    <ModelModifier />
    <hr />
    <StyleScoped />
    <hr />
    <ReactiveRef />
    <hr />
    <ReactiveReactive />
    <hr />
    <ComputedBasic />
    <hr />
    <WatchersBasic />
    <hr />
    <WatchersMulti />
    <hr />
    <WatchersDeep />
    <hr />
    <WatchersReactive />
    <hr />
    <WatchersWatchEffect />
    <hr />
    <LifecycleParent />
    <hr />
    <PropsEmitsParent />
    <hr />
    <SlotDefaultParent />
    <hr />
    <SlotNamedParent />
    <hr />
    <SlotScopedParent />
    <hr />
    <AxiosWeather />
    <hr />
    <AxiosJson />
    <hr />
    <ElementPlus />
  </div>
</template>
