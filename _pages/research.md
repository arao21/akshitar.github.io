---
layout: single
title: "Research"
permalink: /research/
excerpt: "Dynamical models of physiological oscillations: stomach-brain coupling in sleep, nonlinear gastric dynamics, wearable autonomic sensing, and interpretable clinical machine learning."
---

<p class="section__intro" style="font-size:1.0625rem;">
I develop signal-processing and statistical-modeling approaches for multimodal physiology. The through-line
is treating physiological signals as <strong>dynamic oscillators</strong> rather than static summaries:
modeling how rhythms in different organs coordinate, how amplitude and frequency co-evolve within a single
rhythm, and what survives when you move from a sleep laboratory to a wearable.
</p>

<section class="section">
  <p class="section__eyebrow">Dissertation</p>
  <h2 class="section__title">Engineering dynamical biomarkers from gastric electrophysiology</h2>
  <p class="section__intro">
    Human physiological oscillations are usually analysed one organ at a time, or compressed into static
    summaries. My thesis argues that a single noninvasive gastric recording supports three distinct levels
    of inference &mdash; how the stomach <em>coordinates</em> with the brain, how amplitude and frequency
    <em>co-evolve</em> within the gastric oscillator itself, and whether those markers survive outside
    the laboratory.
  </p>

  <div class="aims aims--index">
    <a class="aim" href="#aim-1">
      <p class="aim__num">AIM 01</p>
      <h3 class="aim__title">Stomach&ndash;brain coupling during human sleep</h3>
      <p class="aim__body">Gastric rhythms track cortical sleep architecture, and predict memory and sleep quality.</p>
      <div class="aim__foot"><span class="tag tag--live">Preprint</span></div>
    </a>

    <a class="aim" href="#aim-2">
      <p class="aim__num">AIM 02</p>
      <h3 class="aim__title">Nonlinear oscillator models of gastric electrophysiology</h3>
      <p class="aim__body">Phase-shear captures how amplitude bends frequency, from a single electrode.</p>
      <div class="aim__foot"><span class="tag tag--live">Preprint</span></div>
    </a>

    <a class="aim" href="#aim-3">
      <p class="aim__num">AIM 03</p>
      <h3 class="aim__title">Dynamic gastric biomarkers in ambulatory settings</h3>
      <p class="aim__body">Does the signal survive at home, across repeated nights?</p>
      <div class="aim__foot"><span class="tag">In progress</span></div>
    </a>
  </div>
</section>

<section class="section" id="aim-1">
  <p class="section__eyebrow">Dissertation &middot; Aim 1</p>
  <h2 class="section__title">Stomach&ndash;brain coupling during human sleep</h2>

  <p><strong>Question.</strong> Does the sleeping brain stay coordinated with peripheral organs, and does that
  coordination carry functional information?</p>

  <p>Sleep is usually described from the cortex outward. Using simultaneous 64-channel EEG and
  electrogastrography (EGG) recorded overnight in 60 healthy adults, I built a cross-frequency, event-linked
  framework for quantifying stomach&ndash;brain electrophysiology across NREM sleep. Three findings anchor
  the work:</p>

  <ul>
    <li>Gastric phase aligns with cortical delta and sigma activity, and coupling is strongest during
    <strong>coupled slow-oscillation&ndash;spindle events</strong>.</li>
    <li>Gastric power itself fluctuates at an <strong>infraslow timescale</strong> that tracks infraslow sigma-power
    fluctuations during deep sleep.</li>
    <li>Stomach&ndash;brain coupling relates to <strong>next-day memory recall</strong>, and gastric dynamics explain
    <strong>subjective sleep quality</strong> beyond conventional polysomnographic and cardiac measures.</li>
  </ul>

  <p>Together this reframes sleep as a coordinated multi-organ state, and shows that a noninvasive abdominal
  electrode adds information that scalp EEG alone does not provide.</p>

  <p class="section__more"><strong>Methods:</strong> time&ndash;frequency decomposition, phase&ndash;amplitude coupling,
  event-triggered averaging, linear mixed-effects models, permutation testing.</p>

  <div class="entry__links" style="margin-top:1rem;">
    <a href="https://www.biorxiv.org/content/10.1101/2025.11.13.686572v2">Preprint (bioRxiv)</a>
    <a href="{{ site.baseurl }}/publications/">Citation</a>
  </div>

  <div class="research-figure">
    <img src="{{ site.baseurl }}/images/BrainBodyGraphic.gif" alt="Diagram of gastric slow-wave rhythms coupling to NREM cortical oscillations via the vagus nerve, with downstream effects on memory consolidation and sleep quality">
    <div class="caption">
      <strong>Key idea.</strong> Multimodal overnight recordings reveal gut&ndash;brain coupling across timescales,
      with functional consequences for next-day memory recall and subjective sleep quality.
    </div>
  </div>
</section>

<section class="section" id="aim-2">
  <p class="section__eyebrow">Dissertation &middot; Aim 2</p>
  <h2 class="section__title">Nonlinear oscillator models of gastric electrophysiology</h2>

  <p><strong>Question.</strong> Conventional EGG analysis reports dominant frequency, power, or phase. What
  information is thrown away by never modeling how amplitude and frequency interact?</p>

  <p>I represent the gastric-band analytic signal as a <strong>stochastic Stuart&ndash;Landau oscillator</strong> and
  estimate <em>effective phase-shear</em> &mdash; a normalised measure of amplitude-dependent frequency modulation.
  Across overnight recordings in 60 healthy participants, phase-shear was consistently negative, generalised
  to held-out halves of each recording, and was abolished by surrogates that break amplitude&ndash;phase alignment
  while preserving amplitude structure.</p>

  <p>Applied to fasted and fed recordings from healthy participants and participants with gastric dysfunction,
  phase-shear magnitude differed between groups and classified dysfunction <strong>comparably to the strongest
  multielectrode traveling-wave measures &mdash; from a single electrode</strong>. The broader claim: modeling
  amplitude and phase jointly yields more interpretable and more measurement-efficient biomarkers.</p>

  <p class="section__more"><strong>Methods:</strong> stochastic differential equation fitting, parameter-recovery
  simulation, surrogate testing, out-of-sample validation, classification benchmarking.</p>

  <div class="entry__links" style="margin-top:1rem;">
    <a href="https://arxiv.org/abs/2608.23613">Preprint (arXiv)</a>
    <a href="https://arxiv.org/pdf/2608.23613">PDF</a>
  </div>
</section>

<section class="section" id="aim-3">
  <p class="section__eyebrow">Dissertation &middot; Aim 3 &middot; In progress</p>
  <h2 class="section__title">Dynamic gastric biomarkers in ambulatory settings</h2>

  <p><strong>Question.</strong> Do laboratory-derived gastric markers hold up in the real world?</p>

  <p>I am running a longitudinal ambulatory study in which participants record overnight gastric activity at
  home across repeated nights, alongside measures of pre-sleep stress, sleep quality and next-day activity.
  The hypothesis is that the <strong>stability of overnight gastric rhythms</strong> indexes autonomic resilience
  and overnight restoration &mdash; giving a low-burden signal that complements existing wearable measures of
  recovery. Data collection is ongoing; analysis pipelines are in place.</p>
</section>

<section class="section">
  <p class="section__eyebrow">Related work</p>
  <h2 class="section__title">Wearable autonomic sensing for concussion recovery</h2>

  <p>With the Stanford SPARCC concussion clinic, I deploy consumer smartwatches to collect single-lead ECG and
  PPG during an exertional assessment protocol, and maintain the cloud pipeline that turns raw signals into
  autonomic metrics and clinician-facing reports. The engineering problem here is trustworthiness: signal
  quality indexing, robust feature extraction, and understanding how autonomic measures behave across
  devices, behavioural states and noisy real-world conditions.</p>

  <p class="section__more"><strong>Methods:</strong> signal quality indexing, HR/HRV feature extraction,
  serverless data pipelines, validation and benchmarking.</p>
</section>

<section class="section">
  <h2 class="section__title">Interpretable machine learning for facial palsy</h2>

  <p>Clinicians assessing facial-nerve recovery rely on subjective description, coarse ordinal scales and
  static photographs. I developed video-based methods &mdash; likelihood ratio tests, optimal transport, and
  Mahalanobis distances over facial landmark trajectories &mdash; to classify palsy type, localise asymmetric
  regions, and map movement dynamics onto clinical House&ndash;Brackmann scores. A follow-up compared modern
  landmark detectors and replaced least-squares regression with <strong>ordinal regression</strong>, which better
  respects the ordered structure of the grading scale and meaningfully reduced prediction error.</p>

  <p class="section__more"><strong>Goal:</strong> give surgeons objective, longitudinal evidence for facial
  reanimation decisions.</p>

  <div class="entry__links" style="margin-top:1rem;">
    <a href="https://ieeexplore.ieee.org/document/10992271">IEEE TBME 2025</a>
    <a href="https://ieeexplore.ieee.org/document/11254715">IEEE EMBC 2025</a>
  </div>

  <div class="research-figure">
    <img src="{{ site.baseurl }}/images/facialPalsy.png" alt="Facial landmark tracking and asymmetry analysis for facial palsy assessment">
  </div>
</section>

<section class="section">
  <h2 class="section__title">Earlier work: bioelectronics for cardiac tissue engineering</h2>

  <p>Before Stanford I built integrated bioelectronic platforms for monitoring and modulating engineered
  cardiac tissue &mdash; flexible multi-electrode arrays for 3D culture, heart-on-a-chip systems for recording
  electrophysiology under acute hypoxia, and combined optogenetic and bioelectronic interfaces for long-term
  stimulation and recording.</p>
</section>

<section class="section">
  <h2 class="section__title">Tools &amp; collaboration</h2>

  <p>Python for signal processing and modeling (MNE, NumPy/SciPy, statsmodels, scikit-learn, PyTorch), with
  reproducible pipelines on HPC. I am always interested in collaborations on multimodal physiology, oscillator
  models, wearable analytics, and clinical translation &mdash; <a href="mailto:akshitar@stanford.edu">get in touch</a>.</p>
</section>
