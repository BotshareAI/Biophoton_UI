import {
  memo,
  useMemo,
  useCallback,
  useEffect,
  useState,
  useRef,
  Dispatch,
  SetStateAction
} from 'react'
import { Button } from '../ui/button'
import { useRemediesStore } from '@renderer/store/remediesStore'
import { Remedy } from '@shared/types/remedy'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { RemediesDialog } from './RemediesDialog'
import { RemediesDrawer } from './RemediesDrawer'
import { Eye, EyeOff } from 'lucide-react'
import { Field } from '../layout/Field'
import { useCategoriesStore } from '@renderer/store/categoriesStore'

interface RemediesProps {
  footplate?: boolean
  searchTerm: string
  setSearchTerm: Dispatch<SetStateAction<string>>
  onFocus: () => void
}

export const Remedies = ({
  footplate = false,
  searchTerm,
  setSearchTerm,
  onFocus
}: RemediesProps): React.JSX.Element => {
  const getRemediesByCategory = useRemediesStore((state) => state.getRemediesByCategory)
  const getRemediesByMeridian = useRemediesStore((state) => state.getRemediesByMeridian)
  const allRemedies = useRemediesStore((state) => state.remedies)
  // const isFootplate = useRemediesStore((state) => state.isFootplate)

  const activeRemedies = useRemediesStore((state) =>
    footplate ? state.footplateRemedies : state.selectedRemedies
  )
  const setActiveSlotIndex = useRemediesStore((state) => state.setActiveSlotIndex)
  const activeSlotIndex = useRemediesStore((state) =>
    footplate ? state.footPlateActiveSlotIndex : state.activeSlotIndex
  )
  const setRemedyAtSlot = useRemediesStore((state) => state.setRemedyAtSlot)
  const setMainRemedies = useRemediesStore((state) => state.setRemedies)

  const [isScan, setIsScan] = useState(false)
  const categories = useCategoriesStore((s) => s.categories)
  const meridians = useCategoriesStore((s) => s.meridians)
  const [category, setCategory] = useState(categories[0].name)
  const getSubcategories = useCategoriesStore((s) => s.getSubcategories)
  const defaultSubcategory = getSubcategories(category)[0].name
  const [subcategory, setSubcategory] = useState(defaultSubcategory)
  const [remedies, setRemedies] = useState<Remedy[]>(
    getRemediesByCategory(categories[0].name, defaultSubcategory)
  )
  const [remedies2, setRemedies2] = useState<Remedy[]>(getRemediesByMeridian(meridians[0].value))
  const [selectedRemedies, setSelectedRemedies] = useState<Remedy[]>([])
  const [open, setOpen] = useState(false)
  const [scan5, setScan5] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [filterMeridian, setFilterMeridian] = useState<string | null>(null)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [viewRemedyPopup, toggleRemedyPopup] = useState(true)

  const [meridian, setMeridian] = useState(meridians[0].value)
  const [searchCategory, setSearchCategory] = useState('none')
  const [searchMeridian, setSearchMeridian] = useState('none')

  const dialogType = useRef('')

  useEffect(() => {
    setSelectedRemedies(activeRemedies.filter((r) => r !== null))
  }, [activeRemedies])

  const onChooseRemedy = useCallback(
    (r: Remedy): void => {
      if (isScan) {
        if (selectedRemedies.includes(r)) {
          setSelectedRemedies((prev) => prev.filter((remedy) => remedy.id !== r.id))
        } else {
          setSelectedRemedies((prev) => [...prev, r])
        }
      } else {
        if (selectedRemedies.includes(r)) {
          const filteredRemedies = selectedRemedies.filter((remedy) => remedy.id !== r.id)
          setSelectedRemedies(filteredRemedies)
          setMainRemedies(filteredRemedies, footplate)
          setActiveSlotIndex(filteredRemedies.length > 1 ? filteredRemedies.length : 0, footplate)
        } else {
          if (activeSlotIndex < 10) {
            !openDrawer && setOpenDrawer(true)
            const remediesLen = selectedRemedies.length
            setRemedyAtSlot(activeSlotIndex, r, footplate)
            setSelectedRemedies((prev) => [...prev, r])
            setActiveSlotIndex(remediesLen + 1, footplate)
          } else {
            dialogType.current = 'error'
            setOpen(true)
          }
        }
      }
    },
    [
      isScan,
      selectedRemedies,
      activeSlotIndex,
      setActiveSlotIndex,
      setRemedyAtSlot,
      setMainRemedies,
      footplate,
      openDrawer
    ]
  )

  const onScan = useCallback(() => {
    if (isScan) {
      if (!scan5) {
        dialogType.current = 'scan5'
        setScan5(true)
        setOpen(true)
      } else {
        dialogType.current = 'set5'
        setScan5(false)
        setOpen(true)
      }
    } else {
      setIsScan(true)
      setSelectedRemedies(getRemediesByCategory(category, subcategory).slice(0, 5))
    }
  }, [isScan, scan5, getRemediesByCategory, category, subcategory])

  const onScan5 = (): void => {
    const remedy = getRemediesByCategory(category, subcategory).slice(0, 1)
    setSelectedRemedies(remedy)
    setMainRemedies(remedy, footplate)
    setOpen(false)
    setIsScan(false)
    setScan5(false)
  }

  const onCancel = (): void => {
    setIsScan(false)
    setScan5(false)
    setSelectedRemedies(activeRemedies.filter((r) => r !== null))
    setOpen(false)
  }

  const onSet = (): void => {
    setMainRemedies(selectedRemedies.slice(0, 10), footplate)
    setIsScan(false)
    setOpen(false)
  }

  const onCancelSet = (): void => {
    setIsScan(false)
    setSelectedRemedies(activeRemedies.filter((r) => r !== null))
    setOpen(false)
  }

  const filteredRemedies = useMemo(() => {
    return allRemedies.filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory ? r.category === filterCategory : true
      const matchesMeridian = filterMeridian ? r.meridianIds.includes(filterMeridian) : true
      return matchesSearch && matchesCategory && matchesMeridian
    })
  }, [allRemedies, searchTerm, filterCategory, filterMeridian])

  return (
    <div className="w-full">
      {/* <p className="text-lg font-semibold mb-2">
        {footplate || isFootplate ? 'Footplate' : 'Handrod'} Remedies
      </p> */}
      <div className="flex gap-4 w-full">
        <Tabs className="w-full" defaultValue="category">
          <div className="flex mb-2 gap-2 relative">
            <TabsList>
              <TabsTrigger value="category">Category</TabsTrigger>
              <TabsTrigger value="meridian">Meridian</TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
            </TabsList>
            <Button
              variant="ghost"
              onClick={() => toggleRemedyPopup(!viewRemedyPopup)}
              className="absolute right-0 top-0"
            >
              {viewRemedyPopup ? <Eye /> : <EyeOff />}
            </Button>
          </div>
          <TabsContent value="category" className="flex flex-col gap-2">
            <div className="flex gap-2 mb-2">
              <Field label="Category" className="w-full" labelClassName="font-medium">
                <Select
                  onValueChange={(value) => {
                    const subcategory = getSubcategories(value)[0].name
                    if (isScan) {
                      setSelectedRemedies(getRemediesByCategory(value, subcategory))
                    }
                    setRemedies(getRemediesByCategory(value, subcategory))
                    setCategory(value)
                    setSubcategory(subcategory)
                  }}
                  value={category}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Subcategory" className="w-full" labelClassName="font-medium">
                <Select
                  onValueChange={(value) => {
                    if (isScan) {
                      setSelectedRemedies(getRemediesByCategory(category, value))
                    }
                    setRemedies(getRemediesByCategory(category, value))
                    setSubcategory(value)
                  }}
                  value={subcategory}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSubcategories(category).map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Button
                variant={isScan ? 'default' : 'outline'}
                onClick={onScan}
                className="self-end"
              >
                Scan
              </Button>
            </div>
            <div className="flex flex-col gap-2 h-[410px] overflow-y-scroll no-scrollbar w-full">
              {remedies.map((r) => (
                <RemedyButton
                  key={r.id}
                  remedyData={r}
                  isActive={selectedRemedies.includes(r)}
                  onSelect={onChooseRemedy}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="meridian" className="flex flex-col gap-2">
            <Field label="Meridian" labelClassName="font-medium">
              <Select
                onValueChange={(value) => {
                  setRemedies2(getRemediesByMeridian(value))
                  setMeridian(value)
                }}
                value={meridian}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {meridians.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex flex-col mt-2 gap-2 h-[410px] overflow-y-scroll no-scrollbar w-full">
              {remedies2.map((r) => (
                <RemedyButton
                  key={r.id}
                  remedyData={r}
                  isActive={selectedRemedies.includes(r)}
                  onSelect={onChooseRemedy}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="search" className="flex flex-col gap-2">
            <div className="flex gap-2 mb-2">
              <Field label="Search" className="flex-1/2" labelClassName="font-medium">
                <Input
                  placeholder="Search remedies"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={onFocus}
                />
              </Field>
              <Field label="Category" className="flex-1/4" labelClassName="font-medium">
                <Select
                  value={searchCategory}
                  onValueChange={(value) => {
                    setFilterCategory(value === 'none' ? null : value)
                    setSearchCategory(value)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Meridian" className="flex-1/4" labelClassName="font-medium">
                <Select
                  value={searchMeridian}
                  onValueChange={(value) => {
                    setFilterMeridian(value === 'none' ? null : value)
                    setSearchMeridian(value)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Meridian" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {meridians.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="flex flex-col gap-2 h-[410px] overflow-y-scroll no-scrollbar w-full">
              {filteredRemedies.map((r) => (
                <RemedyButton
                  key={r.id}
                  remedyData={r}
                  isActive={selectedRemedies.includes(r)}
                  onSelect={onChooseRemedy}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
        <RemediesDialog
          type={dialogType.current}
          open={open}
          setOpen={setOpen}
          onScan={onScan5}
          onCancel={onCancel}
          onSet={onSet}
          onCancelSet={onCancelSet}
        ></RemediesDialog>
        <RemediesDrawer
          remedies={selectedRemedies}
          openDrawer={viewRemedyPopup && openDrawer}
          setOpenDrawer={setOpenDrawer}
        />
      </div>
    </div>
  )
}

const RemedyButton = memo(function RemedyButton({
  remedyData,
  isActive,
  onSelect
}: {
  remedyData: Remedy
  isActive: boolean
  onSelect: (r: Remedy) => void
}) {
  const handleClick = useCallback(() => {
    onSelect(remedyData)
  }, [onSelect, remedyData])

  return (
    <Button
      onClick={handleClick}
      className="text-center"
      variant={isActive ? 'default' : 'outline'}
    >
      <span className="inline-block max-w-full overflow-hidden whitespace-nowrap text-ellipsis text-left">
        {remedyData.name}
      </span>
    </Button>
  )
})
